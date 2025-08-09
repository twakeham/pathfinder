# Chat Interface (Chat Playground) - Product Requirements Document

## Introduction/Overview

Build a ChatGPT-like interface (“Chat Playground”) accessible from the Welcome screen after login. The page provides a real-time chat experience powered by the existing AI model integration layer. Responses stream incrementally over WebSockets (Django Channels), with a REST fallback. Conversations persist using the current Conversation/Message models.

Goal: Give users a fast, familiar chat experience to experiment with AI and prompts, leveraging the already-implemented OpenAI (and Echo) providers, without requiring them to navigate course content first.

## Goals

1. Provide a responsive, streaming chat UI accessible from the Welcome screen.
2. Use the existing AI model service abstraction and provider selection logic.
3. Persist chat history within the current Conversation/Message models.
4. Offer basic parameter controls (temperature, max tokens) and advanced options collapsed (top-p, model select).
5. Ensure graceful fallback to REST if WebSockets are unavailable.

## User Stories

- As a logged-in user, I can click “Chat Playground” from the Welcome screen and start chatting immediately.
- As a user, I see the assistant’s reply stream in token-by-token (or chunked) so I don’t have to wait for the full response.
- As a user, I can adjust temperature and max tokens; optionally expand advanced settings to tweak top-p or pick a model.
- As a user, I can clear the current chat to start a new conversation.
- As a user, I can return later and see the same conversation thread (persisted in backend).

## Functional Requirements

1. Navigation
   1.1 The Welcome screen shows a primary “Chat Playground” link that routes to “/chat”.
   1.2 Only authenticated users can access “/chat”.

2. Chat Session and Persistence
   2.1 On first visit to “/chat”, the frontend creates a new Conversation via REST and uses its ID for messages.
   2.2 Messages are stored via existing endpoints; new user messages are appended and assistant replies are persisted.
   2.3 “Clear chat” ends the current thread and starts a fresh Conversation.

3. Streaming
   3.1 The client opens a WebSocket to ws/chat/<conversation_id>/ after auth.
   3.2 Event schema (minimum):
       - message_start: { id, role: "assistant", created_at }
       - delta: { id, content_chunk }
       - message_end: { id, full_content, tokens? }
   3.3 If the WS connection fails or is unavailable, the client falls back to the REST generate endpoint and renders the reply non-streaming.

4. Provider and Parameters
   4.1 Use backend provider defaults (USE_OPENAI or query param for dev/testing).
   4.2 Visible controls: Temperature (0.0–1.0, default 0.7), Max tokens (256–1024, default 512).
   4.3 Advanced (collapsed): Top-p (0.0–1.0, default 1.0), Model select (defaults to OPENAI_CHAT_MODEL; restrict to allowed list).
   4.4 Selected parameters are sent with each generate request (REST) or initial WS payload.

5. UI/UX
   5.1 Layout similar to familiar chat UIs: message list, input box, send button.
   5.2 Show a streaming indicator (typing dots/progress) during assistant generation.
   5.3 Error states: clear inline error for auth issues, provider failures (show provider_used and message), and fallback used.
   5.4 “Clear chat” confirmation to avoid accidental loss of the current thread.

6. Security & Permissions
   6.1 Require authenticated access for REST and WS; enforce ownership on conversations.
   6.2 No exposure of API keys to the frontend; provider selection guarded server-side.

## Non-Goals (Out of Scope)

- Full conversation list UI, rename, tag/folder organization (future 4.14 scope).
- Sharing/export features (future 4.9/4.10 scope).
- Side-by-side model comparison (future 4.7 scope).
- Rate limiting controls/analytics dashboards (future 5.x scope).

## Design Considerations

- Reuse existing Channels setup and ChatConsumer route at ws/chat/<conversation_id>/.
- Keep component styling aligned with existing instructor/editor UI patterns (toggles, buttons).
- Use a compact controls panel; advanced settings behind a disclosure.

## Technical Considerations

- Backend already provides Conversation/Message models, REST viewsets, and a ChatConsumer.
- OpenAI path now uses openai>=1.40.0 with an httpx 0.28-compatible client init; provider selection via settings.USE_OPENAI or ?provider.
- Frontend should send auth token on REST; WS must join a room scoped by conversation_id with ownership validation.
- For streaming: backend may simulate chunking initially; later, integrate real token stream from provider (future enhancement).

## Success Metrics

- Time-to-first-token under ~1.5s on local dev for short prompts.
- Streaming fallback rate under 10% during normal dev use.
- Error rate for generate requests below 2% after initial setup.
- At least 3 successful prompts per session on average in internal testing.

## Open Questions

1. Should we add a minimal conversation title auto-generation (first user prompt) in v1?
2. Which models should be exposed in the advanced selector for non-admin users?
3. Do we need a per-session parameter memory, or always send current UI values?
