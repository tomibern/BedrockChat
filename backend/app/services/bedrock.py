import os
from collections.abc import Iterator

import boto3
from botocore.config import Config


AVAILABLE_MODELS = [
    {
        "id": "us.anthropic.claude-haiku-4-5-20251001-v1:0",
        "name": "Claude Haiku (rápido)",
    },
    {
        "id": "us.anthropic.claude-sonnet-4-5-20251001-v1:0",
        "name": "Claude Sonnet (potente)",
    },
]

DEFAULT_MODEL_ID = AVAILABLE_MODELS[0]["id"]
ALLOWED_MODEL_IDS = {m["id"] for m in AVAILABLE_MODELS}


def _client():
    region = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    return boto3.client(
        "bedrock-runtime",
        region_name=region,
        config=Config(retries={"max_attempts": 3, "mode": "standard"}),
    )


def _build_messages(message: str, history: list[dict] | None) -> list[dict]:
    msgs: list[dict] = []
    for h in history or []:
        msgs.append({"role": h["role"], "content": [{"text": h["content"]}]})
    msgs.append({"role": "user", "content": [{"text": message}]})
    return msgs


def chat(message: str, history: list[dict] | None, model_id: str) -> str:
    """Llamada no-streaming a Bedrock — devuelve la respuesta completa."""
    client = _client()
    response = client.converse(
        modelId=model_id,
        messages=_build_messages(message, history),
        inferenceConfig={"maxTokens": 2048, "temperature": 0.7},
    )
    return response["output"]["message"]["content"][0]["text"]


def stream_chat(
    message: str, history: list[dict] | None, model_id: str
) -> Iterator[str]:
    """Llamada streaming a Bedrock — yields chunks de texto."""
    client = _client()
    response = client.converse_stream(
        modelId=model_id,
        messages=_build_messages(message, history),
        inferenceConfig={"maxTokens": 2048, "temperature": 0.7},
    )
    for event in response["stream"]:
        if "contentBlockDelta" in event:
            delta = event["contentBlockDelta"].get("delta", {})
            text = delta.get("text")
            if text:
                yield text
