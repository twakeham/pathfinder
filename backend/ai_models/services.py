from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Iterable, Optional
import os

try:
    from openai import OpenAI
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore

@dataclass
class ChatMessage:
    role: str
    content: str

class AIModel(ABC):
    @abstractmethod
    def chat(self, messages: Iterable[ChatMessage], *, model: Optional[str] = None, temperature: float = 0.7, max_tokens: int = 512) -> ChatMessage:
        ...

class EchoModel(AIModel):
    def chat(self, messages: Iterable[ChatMessage], *, model: Optional[str] = None, temperature: float = 0.7, max_tokens: int = 512) -> ChatMessage:
        last_user = next((m for m in reversed(list(messages)) if m.role == 'user'), None)
        return ChatMessage(role='assistant', content=last_user.content if last_user else '(no input)')


class OpenAIModel(AIModel):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY')
        if not self.api_key:
            raise RuntimeError('OPENAI_API_KEY not configured')
        if OpenAI is None:
            raise RuntimeError('openai package not installed')
        self.client = OpenAI(api_key=self.api_key)

    def chat(self, messages: Iterable[ChatMessage], *, model: Optional[str] = None, temperature: float = 0.7, max_tokens: int = 512) -> ChatMessage:
        model_name = model or os.environ.get('OPENAI_CHAT_MODEL', 'gpt-4o-mini')
        payload = [{ 'role': m.role, 'content': m.content } for m in messages]
        resp = self.client.chat.completions.create(
            model=model_name,
            messages=payload,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        content = (resp.choices[0].message.content or '').strip()
        return ChatMessage(role='assistant', content=content)
