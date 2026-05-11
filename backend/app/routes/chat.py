import json
from collections.abc import Iterator

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.models.schemas import (
    ChatRequest,
    ChatResponse,
    ModelInfo,
    ModelsResponse,
)
from app.services import bedrock


router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/models", response_model=ModelsResponse)
def models() -> ModelsResponse:
    return ModelsResponse(
        models=[ModelInfo(**m) for m in bedrock.AVAILABLE_MODELS]
    )


@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest) -> ChatResponse:
    model_id = body.model
    if model_id not in bedrock.ALLOWED_MODEL_IDS:
        raise HTTPException(status_code=400, detail=f"Modelo no soportado: {model_id}")

    history = [m.model_dump() for m in body.history]
    try:
        text = bedrock.chat(body.message, history, model_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Bedrock error: {exc}") from exc

    return ChatResponse(response=text, model=model_id)


@router.get("/stream")
def stream(
    message: str = Query(..., min_length=1),
    model: str = Query(bedrock.DEFAULT_MODEL_ID),
    history: str | None = Query(None, description="JSON-encoded list of {role, content}"),
) -> StreamingResponse:
    if model not in bedrock.ALLOWED_MODEL_IDS:
        raise HTTPException(status_code=400, detail=f"Modelo no soportado: {model}")

    parsed_history: list[dict] = []
    if history:
        try:
            parsed_history = json.loads(history)
            if not isinstance(parsed_history, list):
                raise ValueError("history must be a list")
        except (json.JSONDecodeError, ValueError) as exc:
            raise HTTPException(status_code=400, detail=f"history inválido: {exc}") from exc

    def event_stream() -> Iterator[bytes]:
        try:
            for chunk in bedrock.stream_chat(message, parsed_history, model):
                payload = json.dumps({"text": chunk}, ensure_ascii=False)
                yield f"data: {payload}\n\n".encode("utf-8")
        except Exception as exc:
            err = json.dumps({"error": str(exc)}, ensure_ascii=False)
            yield f"event: error\ndata: {err}\n\n".encode("utf-8")
            return
        yield b"event: done\ndata: {}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
