import React, { useState, useRef, useEffect } from 'react';

const MAX_LENGTH = 500;

/**
 * Chat input with send button, char limit, and Enter-to-send.
 * @param {{ onSend: (msg: string) => void, disabled: boolean }} props
 */
export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  function handleSubmit(e) {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const remaining = MAX_LENGTH - value.length;
  const nearLimit = remaining <= 50;

  return (
    <form className="sa-input-form" onSubmit={handleSubmit} aria-label="Send a message">
      <div className="sa-input-wrap">
        <textarea
          ref={inputRef}
          className="sa-input"
          value={value}
          onChange={e => setValue(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          disabled={disabled}
          rows={1}
          maxLength={MAX_LENGTH}
          aria-label="Message input"
          aria-describedby="sa-char-count"
        />
        <button
          type="submit"
          className="sa-send-btn"
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          <svg style={{ transform: 'translate(-1px, 1px)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      {nearLimit && (
        <span id="sa-char-count" className="sa-char-count" aria-live="polite">
          {remaining} characters remaining
        </span>
      )}
    </form>
  );
}
