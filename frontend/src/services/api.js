// Chat API helpers. Inject an apiFetch (from AuthContext) that handles JWT & refresh.

export const createChatApi = (apiFetch) => {
  if (typeof apiFetch !== 'function') {
    throw new Error('apiFetch is required');
  }

  const createConversation = async () => {
    const res = await apiFetch('/api/chat/conversations/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      let message = `Create conversation failed: ${res.status}`;
      let body;
      try { body = await res.json(); message = body?.detail || message; } catch {}
      const err = new Error(message);
      err.status = res.status;
      err.body = body;
      err.providerUsed = body?.provider_used;
      throw err;
    }
    return res.json();
  };

  const listMessages = async (conversationId) => {
    const res = await apiFetch(`/api/chat/conversations/${conversationId}/messages/`);
    if (!res.ok) {
      let message = `Load messages failed: ${res.status}`;
      let body;
      try { body = await res.json(); message = body?.detail || message; } catch {}
      const err = new Error(message);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return res.json();
  };

  const generate = async (conversationId, body) => {
    const res = await apiFetch(`/api/chat/conversations/${conversationId}/generate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    if (!res.ok) {
      // Try to parse JSON error to surface provider_used and detail
      let parsed;
      try { parsed = await res.json(); } catch {}
      const message = parsed?.detail || parsed?.error || `Generate failed: ${res.status}`;
      const err = new Error(typeof message === 'string' ? message : JSON.stringify(message));
      err.status = res.status;
      err.body = parsed;
      err.providerUsed = parsed?.provider_used;
      throw err;
    }
    return res.json();
  };

  return { createConversation, listMessages, generate };
};
