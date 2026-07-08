import React, { useState, useEffect } from 'react';

/**
 * Admin component for viewing and editing the AI system prompt.
 * @param {{ token: string }} props
 */
export default function PromptEditor({ token }) {
  const [prompt, setPrompt] = useState('');
  const [original, setOriginal] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load current prompt from system_settings via GET /api/system/settings
    fetch('/api/system/settings', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const p = data?.ai_sales_agent_prompt || '';
        setPrompt(p);
        setOriginal(p);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  async function handleSave() {
    if (prompt.trim().length < 50) {
      setStatus('error');
      setMessage('Prompt must be at least 50 characters.');
      return;
    }

    const confirmed = window.confirm('Update the AI system prompt? This will take effect immediately for all new conversations.');
    if (!confirmed) return;

    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/sales-agent/admin/prompt', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ systemPrompt: prompt.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setOriginal(prompt.trim());
        setStatus('success');
        setMessage(data.message || 'Prompt updated successfully!');
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to update prompt.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 4000);
    }
  }

  const isDirty = prompt !== original;

  if (loading) {
    return <div className="sa-admin-loading"><div className="sa-spinner"></div><p>Loading prompt…</p></div>;
  }

  return (
    <div className="sa-prompt-editor">
      <div className="sa-prompt-editor__header">
        <h3 className="sa-admin-section-title">🤖 AI System Prompt</h3>
        <p className="sa-prompt-editor__desc">
          This prompt defines the AI agent's personality, knowledge, and boundaries.
          Changes take effect immediately for new conversations.
        </p>
      </div>

      <div className="sa-prompt-editor__stats">
        <span>{prompt.length} characters</span>
        {isDirty && <span className="sa-prompt-unsaved">● Unsaved changes</span>}
      </div>

      <textarea
        className="sa-prompt-textarea"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        rows={24}
        placeholder="Enter the system prompt for the AI sales agent…"
        aria-label="AI system prompt"
        spellCheck={true}
      />

      {status && (
        <div className={`sa-admin-status sa-admin-status--${status}`} role="alert">
          {message}
        </div>
      )}

      <div className="sa-prompt-editor__actions">
        <button
          className="sa-admin-btn sa-admin-btn--secondary"
          onClick={() => setPrompt(original)}
          disabled={!isDirty || saving}
        >
          Discard Changes
        </button>
        <button
          className="sa-admin-btn sa-admin-btn--primary"
          onClick={handleSave}
          disabled={!isDirty || saving}
          aria-busy={saving}
        >
          {saving ? 'Saving…' : 'Save Prompt'}
        </button>
      </div>
    </div>
  );
}
