import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

/**
 * MessageList
 * - Renders a list of messages for a conversation
 * - Placeholder-only for Task 1.4.2; real data/state will be wired in later tasks
 */
export default function MessageList({ messages = [], showTyping = false }) {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping]);

  if (!messages || messages.length === 0) {
    return <div className="chat-empty">No messages yet. Say hello!</div>;
  }
  return (
    <div className="message-list" role="log" aria-live="polite" aria-relevant="additions">
      {messages.map((m, idx) => {
        const role = m.role || 'user';
        const roleLabel = role === 'assistant' ? 'Assistant' : 'You';
        return (
          <div key={m.id || idx} className={`message-row message-${role}`}>
            <div className="message-role" aria-hidden="true">{roleLabel}</div>
            <div className={`message-item message-${role}`}>
              <div className="message-content markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                  {String(m.content || '')}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        );
      })}
      {showTyping && (
        <div className="message-row message-assistant">
          <div className="message-role" aria-hidden="true">Assistant</div>
          <div className="message-item message-assistant typing-bubble" aria-live="polite" aria-label="Assistant is typing">
            <div className="typing-dots" aria-hidden="true">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
