import React from 'react';

/**
 * Renders a single chat message bubble.
 * @param {{ message: {id, sender, messageText, createdAt}, sender: 'user'|'agent' }} props
 */
export default function MessageBubble({ message }) {
  const isAgent = message.sender === 'agent';
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  // Simple markdown: bold (**text**), line breaks
  function renderText(text) {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      // Render newlines
      return part.split('\n').map((line, j, arr) => (
        <React.Fragment key={`${i}-${j}`}>
          {line}
          {j < arr.length - 1 && <br />}
        </React.Fragment>
      ));
    });
  }

  return (
    <div className={`sa-message-row sa-message-row--${isAgent ? 'agent' : 'user'}`}>
      {isAgent && (
        <div className="sa-avatar" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>
      )}
      <div className="sa-bubble-wrap">
        <div className={`sa-bubble sa-bubble--${isAgent ? 'agent' : 'user'}`}>
          {renderText(message.messageText)}
        </div>
        {time && <span className="sa-message-time">{time}</span>}
      </div>
    </div>
  );
}
