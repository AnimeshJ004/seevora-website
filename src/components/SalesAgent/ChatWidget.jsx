import React, { useState, useCallback } from 'react';
import ChatWindow from './ChatWindow';

/**
 * Floating chat widget — visible on all pages, toggles between minimized and expanded.
 */
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleUnread = useCallback((n) => {
    if (!isOpen) setUnreadCount(prev => prev + n);
  }, [isOpen]);

  return (
    <div className="sa-widget" id="seevora-chat-widget" aria-label="Seevora AI Chat">
      <ChatWindow isOpen={isOpen} onClose={handleClose} onUnread={handleUnread} />

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          className="sa-fab"
          onClick={handleOpen}
          aria-label="Open Seevora AI chat"
          aria-expanded={isOpen}
          aria-controls="seevora-chat-widget"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {unreadCount > 0 && (
            <span className="sa-fab__badge" aria-label={`${unreadCount} unread messages`}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
