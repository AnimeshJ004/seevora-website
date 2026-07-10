import React, { useState, useEffect, useCallback, useRef } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import LeadCaptureForm from './LeadCaptureForm';
import logoIcon from '../../assets/logo-icon.png';

const API_BASE = '/api/sales-agent';

/**
 * The expanded chat window — manages session, messages, lead form, and API calls.
 * @param {{ isOpen: boolean, onClose: () => void, onUnread: (count: number) => void }} props
 */
export default function ChatWindow({ isOpen, onClose, onUnread }) {
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('seevora_chat_session'));
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [slowWarning, setSlowWarning] = useState(false);
  const slowTimer = useRef(null);
  const sessionInitialized = useRef(false);

  // Initialize / restore session on mount
  useEffect(() => {
    if (!isOpen || sessionInitialized.current) return;
    sessionInitialized.current = true;
    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const initSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedId = localStorage.getItem('seevora_chat_session');
      const url = storedId
        ? `${API_BASE}/session?sessionId=${encodeURIComponent(storedId)}&restore=true`
        : `${API_BASE}/session`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to start session');

      setSessionId(data.sessionId);
      localStorage.setItem('seevora_chat_session', data.sessionId);

      // Build messages array — prepend welcome if first visit
      const history = data.messages || [];
      if (data.welcomeMessage && history.length === 0) {
        const welcome = {
          id: 'welcome',
          sender: 'agent',
          messageText: data.welcomeMessage,
          createdAt: new Date().toISOString(),
        };
        setMessages([welcome]);
      } else {
        setMessages(history.map(m => ({
          id: m.id,
          sender: m.sender,
          messageText: m.messageText,
          createdAt: m.createdAt,
        })));
      }
    } catch (err) {
      setError('Unable to connect. Please try again.');
      console.error('[ChatWindow] Session init error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!sessionId || isTyping) return;

    // Optimistically add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      messageText: text,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setError(null);

    // Slow warning timer
    slowTimer.current = setTimeout(() => setSlowWarning(true), 4000);

    try {
      const res = await fetch(`${API_BASE}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(`Too many messages. Please wait ${data.retryAfter || 60} seconds.`);
        }
        if (res.status === 404) {
          // Session expired — reset and reinitialize
          localStorage.removeItem('seevora_chat_session');
          sessionInitialized.current = false;
          await initSession();
          return;
        }
        throw new Error(data.message || 'Failed to send message');
      }

      const agentMsg = {
        id: data.messageId,
        sender: 'agent',
        messageText: data.agentResponse,
        createdAt: data.timestamp,
      };
      setMessages(prev => [...prev, agentMsg]);

      // Show lead form if AI signals it and not already submitted
      if (data.leadCapturePrompt && !leadSubmitted) {
        setTimeout(() => setShowLeadForm(true), 600);
      }

      // Notify parent of unread if window is not visible
      if (!document.hasFocus()) {
        onUnread?.(1);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsTyping(false);
      setSlowWarning(false);
      clearTimeout(slowTimer.current);
    }
  }, [sessionId, isTyping, leadSubmitted, initSession, onUnread]);

  const submitLead = useCallback(async (formData) => {
    if (!sessionId) return;
    const res = await fetch(`${API_BASE}/lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, ...formData }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to submit');
    }

    setShowLeadForm(false);
    setLeadSubmitted(true);

    // Add confirmation message
    const confirmMsg = {
      id: `confirm-${Date.now()}`,
      sender: 'agent',
      messageText: data.message,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, confirmMsg]);
  }, [sessionId]);

  // End session on window close
  const handleClose = useCallback(() => {
    if (sessionId) {
      fetch(`${API_BASE}/session/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
    }
    onClose();
  }, [sessionId, onClose]);

  const handleClearChat = useCallback(async () => {
    if (sessionId) {
      fetch(`${API_BASE}/session/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
    }
    localStorage.removeItem('seevora_chat_session');
    setSessionId(null);
    setMessages([]);
    setLeadSubmitted(false);
    setShowLeadForm(false);
    setError(null);
    await initSession();
  }, [sessionId, initSession]);

  if (!isOpen) return null;

  return (
    <div className="sa-window" role="dialog" aria-label="Seevora AI Chat" aria-modal="true">
      {/* Header */}
      <div className="sa-window__header">
        <div className="sa-window__header-left">
          <div className="sa-window__avatar" aria-hidden="true">
            <img src={logoIcon} alt="Seevora Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          </div>
          <div>
            <p className="sa-window__name">Seevora AI</p>
            <p className="sa-window__status">
              <span className="sa-status-dot" aria-hidden="true"></span>
              Online
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="sa-window__close" onClick={handleClearChat} aria-label="Clear chat" title="Clear Chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
          <button className="sa-window__close" onClick={handleClose} aria-label="Close chat" title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="sa-window__body">
        {isLoading ? (
          <div className="sa-loading">
            <div className="sa-spinner" aria-label="Loading conversation…"></div>
          </div>
        ) : (
          <MessageList messages={messages} isTyping={isTyping} />
        )}

        {slowWarning && isTyping && (
          <p className="sa-slow-warning">Taking a moment… still working on it.</p>
        )}

        {error && (
          <div className="sa-error-banner" role="alert">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Dismiss error">✕</button>
          </div>
        )}
      </div>

      {/* Lead Form */}
      {showLeadForm && !leadSubmitted && (
        <div className="sa-window__lead">
          <LeadCaptureForm
            onSubmit={submitLead}
            onCancel={() => setShowLeadForm(false)}
          />
        </div>
      )}

      {/* Input */}
      {!showLeadForm && (
        <div className="sa-window__footer">
          {messages.length < 3 && (
            <div className="sa-suggestion-strip">
              <button type="button" onClick={() => sendMessage("What is Seevora?")} className="sa-suggestion-chip">What is Seevora?</button>
              <button type="button" onClick={() => sendMessage("How much does it cost?")} className="sa-suggestion-chip">Pricing plans?</button>
              <button type="button" onClick={() => sendMessage("How does the AI voice receptionist work?")} className="sa-suggestion-chip">AI Voice Receptionist?</button>
            </div>
          )}
          <ChatInput onSend={sendMessage} disabled={isTyping || isLoading} />
          <p className="sa-powered-by">Powered by Seevora AI</p>
        </div>
      )}
    </div>
  );
}
