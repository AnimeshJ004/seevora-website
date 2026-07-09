import React, { useState, useCallback, useEffect } from 'react';
import ChatWindow from './ChatWindow';

const STORAGE_KEY = 'seevora_chat_open';

/**
 * Floating chat widget — visible on all pages, toggles between minimized and expanded.
 * Persists open/closed state in localStorage across page navigation.
 */
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync isOpen to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isOpen));
    } catch {
      // ignore storage errors (e.g. private browsing quota)
    }
  }, [isOpen]);

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
