from typing import Literal
from pydantic import BaseModel, Field


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: list[Message] = Field(default_factory=list)
    model: str = "eu.anthropic.claude-haiku-4-5-20251001-v1:0"


class ChatResponse(BaseModel):
    response: str
    model: str


class ModelInfo(BaseModel):
    id: str
    name: str


class ModelsResponse(BaseModel):
    models: list[ModelInfo]
