from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Iterable, Optional
import os
import typing as _t
import httpx as _httpx
try:
    import openai as _openai
except Exception:  # pragma: no cover
    _openai = None  # type: ignore

@dataclass
class ChatMessage:
    role: str
    content: str

class AIModel(ABC):
    @abstractmethod
    def chat(
        self,
        messages: Iterable[ChatMessage],
        *,
        model: Optional[str] = None,
        temperature: float = 0.7,
        top_p: float = 1.0,
        max_tokens: int = 512,
    ) -> ChatMessage:
        ...

class EchoModel(AIModel):
    def chat(self, messages: Iterable[ChatMessage], *, model: Optional[str] = None, temperature: float = 0.7, top_p: float = 1.0, max_tokens: int = 512) -> ChatMessage:
        last_user = next((m for m in reversed(list(messages)) if m.role == 'user'), None)
        return ChatMessage(role='assistant', content=last_user.content if last_user else '(no input)')


class OpenAIModel(AIModel):
    """OpenAI provider supporting both v1 (client) and legacy v0 APIs.

    Chooses implementation at runtime based on available attributes in the
    imported `openai` package. Avoids passing unsupported kwargs.
    """

    def __init__(self, api_key: Optional[str] = None):
        if _openai is None:
            raise RuntimeError('openai package not installed')
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY')
        if not self.api_key:
            raise RuntimeError('OPENAI_API_KEY not configured')

        # Detect v1 client vs legacy: OpenAI class exists only in v1+
        self._mode = 'v1' if hasattr(_openai, 'OpenAI') else 'legacy'
        self._client = None
        if self._mode == 'v1':
            # Use environment for key to avoid passing unexpected kwargs
            os.environ['OPENAI_API_KEY'] = self.api_key
            try:
                self._client = _openai.OpenAI()  # type: ignore[attr-defined]
            except TypeError as e:
                # Workaround for httpx>=0.28 where 'proxies' kw was removed;
                # construct our own httpx.Client and pass it in so OpenAI doesn't
                # inject unsupported args.
                if 'proxies' in str(e):
                    self._client = _openai.OpenAI(http_client=_httpx.Client())  # type: ignore[attr-defined]
                else:
                    raise
        else:
            # Legacy 0.x API
            _openai.api_key = self.api_key  # type: ignore[attr-defined]

    def chat(self, messages: Iterable[ChatMessage], *, model: Optional[str] = None, temperature: float = 0.7, top_p: float = 1.0, max_tokens: int = 512) -> ChatMessage:
        model_name = model or os.environ.get('OPENAI_CHAT_MODEL', 'gpt-4o-mini')
        payload = [{ 'role': m.role, 'content': m.content } for m in messages]
        if self._mode == 'v1':
            resp = self._client.chat.completions.create(  # type: ignore[union-attr]
                model=model_name,
                messages=payload,
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens,
            )
            content = (resp.choices[0].message.content or '').strip()
        else:
            # Legacy
            resp = _openai.ChatCompletion.create(  # type: ignore[attr-defined]
                model=model_name,
                messages=payload,
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens,
            )
            # Legacy responses keep text at choices[0].message['content']
            choice0 = resp['choices'][0]
            message = choice0.get('message') or {}
            content = (message.get('content') or '').strip()
        return ChatMessage(role='assistant', content=content)
