## Relevant Files

- `frontend/src/App.js` - Add the “/chat” route and navigation link integration.
- `frontend/src/auth/RequireAuth.jsx` - Guarded route component to restrict access to authenticated users (create if missing).
- `frontend/src/pages/ChatPage.jsx` - Top-level Chat Playground page component.
- `frontend/src/components/chat/MessageList.jsx` - Renders the list of chat messages for a conversation.
- `frontend/src/components/chat/MessageItem.jsx` - Renders a single message with role-based styling.
- `frontend/src/components/chat/Composer.jsx` - Input textarea and send button; handles submit and key bindings.
- `frontend/src/components/chat/ControlsPanel.jsx` - Temperature/max tokens controls; advanced top-p and model selector.
- `frontend/src/services/api.js` - REST helpers (create conversation, list messages, generate, clear); JWT header wiring.
- `frontend/src/services/ws.js` - WebSocket client helper for ws/chat/<conversation_id> with auth token handling and events.
- `frontend/src/styles/chat.css` - Styles for the chat layout and components (or co-located CSS modules).
- `frontend/src/__tests__/ChatPage.test.jsx` - UI tests for routing, rendering, and basic chat interactions.
- `backend/chat/consumers.py` - Implement WS event schema (message_start/delta/message_end) and JWT query auth.
- `backend/chat/views.py` - Ensure generate endpoint accepts/wires parameters (temperature, max_tokens, top_p, model).
- `backend/ai_models/services.py` - Accept generation parameters and map to provider options; validate ranges.
- `backend/config/asgi.py` - Confirm Channels routing for ws/chat/<conversation_id>/.
- `backend/chat/tests.py` - Backend tests for REST generate and WS streaming/fallback behaviors.
- `scripts/pf.py` - Optional: extend test-chat to exercise parameters and note provider_used.

## Tasks

- [ ] 1.0 Navigation and route scaffolding for Chat Playground
	- [x] 1.1 Add “Chat Playground” primary link on the Welcome screen to route to `/chat`.
	- [x] 1.2 Add a `/chat` route in React Router v6 and render `ChatPage`.
	- [x] 1.3 Protect the route with `RequireAuth` (redirect unauthenticated users to login).
	- [ ] 1.4 Scaffold `ChatPage` layout sections: message list, controls panel (collapsed advanced), and composer. Reference the Instructor views to match the styling
	- [x] 1.4.1 Create `frontend/src/pages/ChatPage.jsx` with a top-level layout container (header/main/footer or single column) using CSS Grid/Flex; import `styles/chat.css`. Maintain look and feel consistency with existing views: reuse current button/input styles, spacing/typography tokens, and card/panel patterns so ChatPage visually matches the instructor/editor UI.
	- [x] 1.4.2 Add MessageList region: scrollable container that fills remaining height; placeholder rendering of messages; add `data-testid="message-list"`.
	- [x] 1.4.3 Add ControlsPanel region: compact panel with basic controls; add `data-testid="controls-panel"`. (Advanced removed; show all fields.)
		- [ ] 1.4.4 Add Composer region pinned to bottom: multiline textarea + Send button (disabled when empty); add `data-testid="composer"`.
			- [x] 1.4.4 Add Composer region pinned to bottom: multiline textarea + Send button (disabled when empty); add `data-testid="composer"`.
			- [x] 1.4.5 Implement base styles in `frontend/src/styles/chat.css` (container, scroll regions, spacing, responsive breakpoints).
			- [x] 1.4.6 Define initial React state placeholders: `messages`, `isStreaming`, and `params` (temperature, maxTokens, topP, model); no API wiring yet.
			- [x] 1.4.7 Add Clear Chat button in header or controls area with confirmation handler stub (no backend call yet).
			- [x] 1.4.8 Add loading and empty states (skeleton or hint text) when messages are not yet loaded.
			- [x] 1.4.9 Accessibility scaffolding: role landmarks, labels for controls, and an `aria-live="polite"` region for streaming output.
		- [x] 1.4.10 Basic render test ensuring regions mount and layout classes present.
	- [x] 1.5 Create basic unit tests ensuring the route mounts and is guarded for unauthenticated users.

- [ ] 2.0 Conversation lifecycle and persistence
	- [x] 2.1 Implement API helpers: create conversation, list messages, generate reply, and (optional) delete/clear.
	- [x] 2.2 On first visit, create a new conversation via REST; store `conversationId` in state and `localStorage`.
	- [x] 2.3 On mount, if a saved `conversationId` exists, load it and GET existing messages; render in order.
	- [x] 2.4 Implement “Clear chat”: show confirm dialog; on confirm, create a fresh conversation, reset state, update `localStorage`.
	- [x] 2.5 On send: optimistically append the user message, persist via REST, and reconcile server response IDs.
	- [x] 2.6 Handle failures (network/auth): show inline error, allow retry, and avoid duplicate messages on retry.

- [ ] 3.0 Streaming transport (WebSocket client) with REST fallback and auth
	- [ ] 3.1 Backend: Update `ChatConsumer` to accept JWT in `?token=` query param and authenticate user; enforce conversation ownership.
	- [ ] 3.2 Backend: Implement event schema: `message_start`, `delta`, and `message_end` (simulate chunking initially if needed).
	- [ ] 3.3 Frontend: Build WS client (`ws.js`) to connect to `ws/chat/<conversation_id>/?token=<JWT>`; auto-reconnect off by default.
	- [ ] 3.4 Frontend: Handle events to create a streaming assistant message, append deltas, and finalize on `message_end`.
	- [ ] 3.5 Fallback: If WS connect/send fails or closes during generation, call REST `generate` and render the full reply; show a “fallback used” notice.
	- [ ] 3.6 Tests: Mock WS to validate streaming path; simulate WS failure to validate REST fallback; surface auth failure errors.

- [ ] 4.0 Chat UI/UX (message list, composer, streaming indicator, errors)
	- [ ] 4.1 Implement `MessageList` and `MessageItem` with role-based styles (user vs assistant); auto-scroll to newest message.
	- [ ] 4.2 Add a streaming typing indicator (animated dots) while awaiting/streaming an assistant reply.
	- [ ] 4.3 Implement `Composer` with multiline input: Enter to send, Shift+Enter for newline; disable while generating.
	- [ ] 4.4 Display inline error states with provider details (include `provider_used` when available) and a dismiss control.
	- [ ] 4.5 Accessibility: use `aria-live=polite` for streaming updates, keyboard-focus management, and sufficient contrast.
	- [ ] 4.6 Tests: send interaction, disabled state during generation, auto-scroll behavior, indicator visibility, and error rendering.

- [ ] 5.0 Parameter controls and request wiring (temperature, max tokens; advanced top-p, model select)
	- [ ] 5.1 Build `ControlsPanel` with visible controls: Temperature (0.0–1.0, default 0.7) and Max tokens (256–1024, default 512).
	- [ ] 5.2 Add Advanced (collapsed) controls: Top-p (0.0–1.0, default 1.0) and Model select (allowed list; default from backend).
	- [ ] 5.3 Persist selected parameters in component state and `localStorage`; validate ranges; show helper tooltips.
	- [ ] 5.4 Wire parameters into REST `generate` body and into the initial WS payload; ensure backend uses them.
	- [ ] 5.5 Backend: Update `views.generate` and `OpenAIModel` to accept and validate parameters; cap to safe bounds.
	- [ ] 5.6 Tests: verify parameters are sent on requests, persisted across reloads, and alter backend call behavior.
