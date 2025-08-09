import React, { useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

// Group messages into conversational turns: { user, a, b }
function useTurns(messages) {
  return useMemo(() => {
    const turns = [];
    let current = null;
    for (const m of messages || []) {
      const role = m.role || 'user';
      if (role === 'user') {
        if (current) turns.push(current);
        current = { user: m, a: null, b: null };
      } else if (role === 'assistant') {
        if (!current) {
          // If assistant comes first, start an implicit turn
          current = { user: null, a: null, b: null };
        }
        const v = (m.variant || 'A').toUpperCase();
        if (v === 'B') current.b = m; else current.a = m;
      }
    }
    if (current) turns.push(current);
    return turns;
  }, [messages]);
}

export default function CompareMessageList({ messages = [], showTyping = false }) {
  const endRef = useRef(null);
  const turns = useTurns(messages);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, showTyping]);

  if (!messages || messages.length === 0) {
    return <div className="chat-empty">No messages yet. Say hello!</div>;
  }

  return (
    <div className="message-list compare-list" role="log" aria-live="polite" aria-relevant="additions">
      {turns.map((t, idx) => (
        <div className="compare-turn" key={t.user?.id || t.a?.id || t.b?.id || idx}>
          {t.user && (
            <div className="compare-user">
              <div className="message-role" aria-hidden="true">You</div>
              <div className="message-item message-user">
                <div className="message-content markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                    {String(t.user.content || '')}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
          <div className="compare-columns">
            <div className="compare-col">
              <div className="message-role" aria-hidden="true">Assistant (A)</div>
              {t.a ? (
                <div className="message-item message-assistant">
                  <div className="message-content markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                      {String(t.a.content || '')}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                showTyping && (
                  <div className="message-item message-assistant typing-bubble" aria-live="polite" aria-label="Assistant A is typing">
                    <div className="typing-dots" aria-hidden="true">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                  </div>
                )
              )}
            </div>
            <div className="compare-col">
              <div className="message-role" aria-hidden="true">Assistant (B)</div>
              {t.b ? (
                <div className="message-item message-assistant">
                  <div className="message-content markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                      {String(t.b.content || '')}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                showTyping && (
                  <div className="message-item message-assistant typing-bubble" aria-live="polite" aria-label="Assistant B is typing">
                    <div className="typing-dots" aria-hidden="true">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
