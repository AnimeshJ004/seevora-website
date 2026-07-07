import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

/**
 * Renders the scrollable list of messages, with auto-scroll and typing indicator.
 * @param {{ messages: Array, isTyping: boolean }} props
 */
export default function MessageList({ messages, isTyping }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="sa-message-list" role="log" aria-live="polite" aria-label="Chat messages">
      {messages.map((msg) => (
        <MessageBubble key={msg.id || msg.createdAt} message={msg} />
      ))}

      {isTyping && (
        <div className="sa-message-row sa-message-row--agent">
          <div className="sa-avatar" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <div className="sa-bubble-wrap">
            <div className="sa-bubble sa-bubble--agent">
              <TypingIndicator />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
