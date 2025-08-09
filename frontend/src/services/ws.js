// Lightweight WebSocket client for chat streaming
// connectChat({ conversationId, token, onOpen, onClose, onError, onEvent })

export function connectChat({ conversationId, token, onOpen, onClose, onError, onEvent }) {
  const loc = window.location;
  const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  // Prefer explicit env override for backend WS host (e.g., localhost:8000)
  const override = process.env.REACT_APP_BACKEND_WS; // e.g., localhost:8000
  const host = override || (loc.port === '3000' ? `${loc.hostname}:8000` : loc.host);
  const url = `${proto}//${host}/ws/chat/${conversationId}/?token=${encodeURIComponent(token || '')}`;
  const ws = new WebSocket(url);
  const queue = [];

  ws.onopen = () => {
    // Flush any queued messages sent while CONNECTING
    try {
      while (queue.length) {
        ws.send(queue.shift());
      }
    } catch {}
    onOpen?.();
  };
  ws.onclose = (ev) => onClose?.(ev);
  ws.onerror = (ev) => onError?.(ev);
  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      onEvent?.(data);
    } catch (e) {
      // non-JSON
    }
  };

  return {
    send: (obj) => {
      const payload = JSON.stringify(obj);
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        } else if (ws.readyState === WebSocket.CONNECTING) {
          queue.push(payload);
        }
      } catch {}
    },
    isOpen: () => ws.readyState === WebSocket.OPEN,
    readyState: () => ws.readyState,
    close: () => {
      try { queue.length = 0; ws.close(); } catch {}
    },
    raw: ws,
  };
}
