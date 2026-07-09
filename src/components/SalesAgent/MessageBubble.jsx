import React from 'react';
import logoIcon from '../../assets/logo-icon.png';

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
          <img src={logoIcon} alt="Seevora Logo" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
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
