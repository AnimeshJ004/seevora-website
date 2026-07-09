import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import logoIcon from '../../assets/logo-icon.png';

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
            <img src={logoIcon} alt="Seevora Logo" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
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
