import React, { useState, useEffect, useRef } from 'react';

// Seevora context knowledge base for matching responses
const SEEVORA_KNOWLEDGE = [
  {
    keywords: ['b2b', 'sales', 'merge', 'software', 'agent', 'research', 'modernize'],
    response: "We specialize in B2B sales automation! We research your business model, deploy multiple specialized AI agents, and seamlessly merge them with your existing software stack to accelerate your sales cycles and save massive amounts of time."
  },
  {
    keywords: ['what', 'do', 'about', 'service', 'company', 'product', 'platform', 'explain'],
    response: "Seevora is a next-generation Enterprise AI automation platform built specifically for Indian SMBs. We turn manual workflows into profit centers by automating customer operations: 24/7 Voice Receptionists, WhatsApp automated confirmations, client document collection, UPI billing reminders, and automated local Google SEO reviews. All customized to your specific business rules!"
  },
  {
    keywords: ['hindi', 'language', 'speak', 'english', 'hinglish', 'local', 'voice', 'dialect'],
    response: "Seevora is Hindi-First. Our AI voice agents and chat reply fluently in English, Hindi, or a mix of both (Hinglish), matching the natural tongue and context of your local customers."
  },
  {
    keywords: ['time', 'how long', 'deploy', 'fast', 'ready', 'launch', 'days', 'speed'],
    response: "We get your custom AI receptionist or dashboard integration live in just 5 business days! Our engineering team audits your existing CA, salon, or clinical processes, maps the rules, and deploys without hassle."
  },
  {
    keywords: ['book', 'call', 'contact', 'schedule', 'appointment', 'demo', 'meeting', 'consult'],
    response: "Booking a call is easy! Scroll down to the 'Book a Call' section on this page, or click the 'Book a Call' button in the hero area to schedule a consultation with our integration engineers."
  },
  {
    keywords: ['price', 'pricing', 'cost', 'fee', 'charge', 'expensive', 'free', 'investment'],
    response: "We offer custom-tailored pricing plans based on your required modules and call volumes. Most customers see a 40% operating cost reduction within 90 days. Get in touch by booking a call for a personalized quote!"
  },
  {
    keywords: ['clinic', 'doctor', 'patient', 'hospital', 'missed call', 'medical'],
    response: "For clinics, Seevora acts as a 24/7 front desk assistant. It handles unanswered calls, books appointments directly into your digital calendar, and answers patient inquiries, preventing client loss to competitors."
  },
  {
    keywords: ['salon', 'studio', 'no-show', 'seat', 'remind', 'cancellation'],
    response: "For salons and studios, Seevora automatically sends reminders and confirmations on WhatsApp, reducing client no-shows by 30-40%. If a slot is cancelled, it auto-fills it from your smart waiting list."
  },
  {
    keywords: ['consultant', 'ca', 'file', 'tax', 'receipt', 'reminder', 'signature'],
    response: "For CAs and consultants, Seevora automatically collects client documents, invoices, and tax receipts. It sends polite reminders and UPI payment links, saving your staff up to 8 hours of administrative work weekly."
  },
  {
    keywords: ['whatsapp', 'chat', 'message', 'sms', 'notification'],
    response: "Seevora integrates directly with WhatsApp Business API to send automated confirmations, payment reminders, document collection requests, and follow-ups — all in your customer's preferred language!"
  },
  {
    keywords: ['receptionist', 'call', 'phone', 'missed', 'answer', 'front desk'],
    response: "Our 24/7 AI Voice Receptionist answers every incoming call, even outside business hours. It greets callers, captures their intent, books appointments, and routes urgent queries — so you never miss a customer again."
  }
];

const SUGGESTED_QUESTIONS = [
  "How do you automate B2B sales?",
  "What is multi-agent software merging?",
  "What does Seevora do?",
  "How does the Hindi-First AI work?",
  "How fast can you deploy?",
  "How do I book a call?",
  "What industries do you serve?",
  "Tell me about pricing"
];

const API_FALLBACK_ORIGIN = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';

function buildFallbackUrl(endpoint) {
  const base = API_FALLBACK_ORIGIN.replace(/\/$/, '');
  if (base.endsWith('/api') && endpoint.startsWith('/api/')) {
    return `${base}${endpoint.slice(4)}`;
  }
  return `${base}${endpoint}`;
}

async function chatbotFetch(endpoint, options) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 9000);
  const requestOptions = { ...options, signal: controller.signal };

  try {
    const response = await fetch(endpoint, requestOptions);
    if (response.ok) return response;
  } catch {
    // Try the configured API origin below, then fall back to local canned replies.
  } finally {
    window.clearTimeout(timeout);
  }

  const fallbackResponse = await fetch(buildFallbackUrl(endpoint), options);
  if (fallbackResponse.ok) return fallbackResponse;
  throw new Error('Chatbot API unavailable');
}

function getLocalBotResponse(text) {
  const query = text.toLowerCase().trim();

  const greetings = ['hi', 'hello', 'hey', 'greetings', 'hola', 'yo', 'good morning', 'good afternoon', 'good evening', 'namaste'];
  const isGreeting = greetings.some(g => query === g || query.startsWith(g + ' ') || query.endsWith(' ' + g));

  if (isGreeting) {
    return "Hi! I'm Seevora AI. Nice to meet you. You can ask me casually about Seevora, AI receptionists, WhatsApp follow-ups, pricing, or which automation would fit your business.";
  }

  if (/\b(how are you|how r you|kaise ho|kya haal|what'?s up|sup)\b/.test(query)) {
    return "I'm doing well, thanks for asking. I'm here to help you understand Seevora in a friendly way. Tell me what kind of business you run, and I can suggest useful automations.";
  }

  if (/\b(thanks|thank you|thankyou|dhanyavad|shukriya)\b/.test(query)) {
    return "You're welcome. Ask me anything else about Seevora or your business workflow, and I'll keep it simple.";
  }

  if (/\b(who are you|your name|are you ai|bot)\b/.test(query)) {
    return "I'm Seevora AI, the website assistant for Seevora. I can explain the company, services, industries, setup process, and help you decide whether a discovery call makes sense.";
  }

  if (/\b(help|what can you do|can you help)\b/.test(query)) {
    return "Yes. I can explain Seevora's AI receptionist, WhatsApp automation, appointment booking, document collection, reminders, industry use cases, and pricing approach. You can also just tell me your business problem.";
  }

  const matched = SEEVORA_KNOWLEDGE.find(item =>
    item.keywords.some(keyword => query.includes(keyword))
  );

  if (matched) return matched.response;

  let cleanTopic = query;
  const prefixes = [
    'tell me about', 'tell me more about', 'can you explain', 'can you tell me about',
    'how does seevora handle', 'how do you handle', 'do you support', 'do you have',
    'what is', 'what are', 'information on', 'i want to know about', 'explain',
    'how to', 'can you', 'please', 'show me', 'about'
  ];
  prefixes.sort((a, b) => b.length - a.length);
  for (const prefix of prefixes) {
    if (cleanTopic.startsWith(prefix)) {
      cleanTopic = cleanTopic.slice(prefix.length).trim();
      break;
    }
  }
  cleanTopic = cleanTopic.replace(/[?.!,]/g, '').trim();

  if (cleanTopic.length > 2) {
    const topic = cleanTopic
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return `Excellent question! Seevora's custom AI pipelines can be trained to automate and handle processes related to **${topic}**. During our 5-day integration phase, our engineering team maps your specific business rules and builds custom voice/chat models to support it seamlessly. Would you like to schedule a 15-minute discovery call?`;
  }

  return "That's an interesting question! Seevora offers fully custom AI integrations tailored to your business rules. Our voice receptionists and automated chat workflows speak Hinglish, English, and Hindi fluently. Would you like to schedule a quick 15-minute call with our team to discuss your specific needs?";
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! I'm Seevora, your AI assistant. I can explain how we automate your business missed calls, follow-ups, and workflows. Ask me anything!",
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await chatbotFetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-8).map(({ sender, text }) => ({ sender, text })),
        }),
      });

      const data = await response.json();
      const botResponseText = data.reply || getLocalBotResponse(text);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: botResponseText,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: getLocalBotResponse(text),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── FAB Button ── */
        .seeva-fab {
          position: fixed;
          bottom: 28px;
          right: 28px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6F7F33 0%, #8fa03e 100%);
          border: none;
          box-shadow: 0 8px 32px rgba(111, 127, 51, 0.5), 0 2px 8px rgba(0,0,0,0.15);
          cursor: pointer;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s;
        }
        .seeva-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 40px rgba(111, 127, 51, 0.6), 0 4px 12px rgba(0,0,0,0.2);
        }
        .seeva-fab svg {
          width: 26px;
          height: 26px;
          fill: none;
          stroke: #ffffff;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .seeva-fab-pulse {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid #fff;
          animation: seevaPulse 2s infinite;
        }
        @keyframes seevaPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }

        /* ── Backdrop ── */
        .seeva-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(3px);
          z-index: 9998;
          animation: seevaFadeIn 0.25s ease forwards;
        }
        @keyframes seevaFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ── Full Right Side Panel ── */
        .seeva-panel {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: 420px;
          max-width: 100vw;
          background: #ffffff;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          box-shadow: -8px 0 40px rgba(0, 0, 0, 0.18);
          animation: seevaPanelSlideIn 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          overflow: hidden;
        }
        @keyframes seevaPanelSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .seeva-panel.closing {
          animation: seevaPanelSlideOut 0.3s cubic-bezier(0.55, 0, 1, 0.45) forwards;
        }
        @keyframes seevaPanelSlideOut {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }

        /* ── Panel Header ── */
        .seeva-panel-header {
          background: linear-gradient(135deg, #6F7F33 0%, #8fa03e 100%);
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .seeva-panel-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .seeva-panel-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          border: 2px solid rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }
        .seeva-panel-header-info h3 {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 1.05rem;
          color: #ffffff;
          margin: 0 0 2px 0;
        }
        .seeva-panel-header-info p {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.8);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .seeva-online-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
          display: inline-block;
        }
        .seeva-panel-close {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.15);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
          font-size: 1.1rem;
          line-height: 1;
        }
        .seeva-panel-close:hover {
          background: rgba(255,255,255,0.3);
        }
        .seeva-panel-close svg {
          width: 18px;
          height: 18px;
          stroke: #ffffff;
          stroke-width: 2.5;
          fill: none;
          stroke-linecap: round;
        }

        /* ── Welcome Banner ── */
        .seeva-welcome-banner {
          background: linear-gradient(135deg, #f0f4e8 0%, #e8efd5 100%);
          padding: 14px 24px;
          border-bottom: 1px solid #dde8c0;
          flex-shrink: 0;
        }
        .seeva-welcome-banner p {
          font-size: 0.8rem;
          color: #4a5a1a;
          margin: 0;
          line-height: 1.5;
        }

        /* ── Messages Area ── */
        .seeva-panel-messages {
          flex: 1;
          padding: 20px 20px 12px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #f8fafc;
          scroll-behavior: smooth;
        }
        .seeva-panel-messages::-webkit-scrollbar {
          width: 4px;
        }
        .seeva-panel-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        .seeva-panel-messages::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }

        /* ── Message Rows ── */
        .seeva-msg-row {
          display: flex;
          flex-direction: column;
          max-width: 82%;
        }
        .seeva-msg-row.bot {
          align-self: flex-start;
        }
        .seeva-msg-row.user {
          align-self: flex-end;
        }
        .seeva-msg-row.bot .seeva-msg-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }
        .seeva-msg-bot-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6F7F33, #8fa03e);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
        }
        .seeva-msg-bot-name {
          font-size: 0.7rem;
          font-weight: 600;
          color: #6F7F33;
        }
        .seeva-bubble {
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 0.875rem;
          line-height: 1.55;
        }
        .seeva-msg-row.bot .seeva-bubble {
          background: #ffffff;
          color: #1e293b;
          border: 1px solid #e2e8f0;
          border-top-left-radius: 4px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .seeva-msg-row.user .seeva-bubble {
          background: linear-gradient(135deg, #6F7F33 0%, #8fa03e 100%);
          color: #ffffff;
          border-top-right-radius: 4px;
        }
        .seeva-msg-time {
          font-size: 0.65rem;
          color: #94a3b8;
          margin-top: 4px;
        }
        .seeva-msg-row.bot .seeva-msg-time {
          align-self: flex-start;
          padding-left: 2px;
        }
        .seeva-msg-row.user .seeva-msg-time {
          align-self: flex-end;
          padding-right: 2px;
        }

        /* ── Typing Indicator ── */
        .seeva-typing-bubble {
          display: flex;
          gap: 4px;
          align-items: center;
          padding: 12px 16px;
        }
        .seeva-typing-dot {
          width: 7px;
          height: 7px;
          background: #94a3b8;
          border-radius: 50%;
          animation: seevaBounce 1.4s infinite;
        }
        .seeva-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .seeva-typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes seevaBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        /* ── Suggested Questions ── */
        .seeva-suggestions {
          padding: 10px 20px;
          display: flex;
          gap: 8px;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
          overflow-x: auto;
          flex-wrap: nowrap;
          -webkit-overflow-scrolling: touch;
          flex-shrink: 0;
        }
        .seeva-suggestions::-webkit-scrollbar { display: none; }
        .seeva-chip {
          padding: 7px 14px;
          background: #ffffff;
          border: 1.5px solid #d4e09a;
          border-radius: 100px;
          font-size: 0.75rem;
          color: #6F7F33;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          flex-shrink: 0;
          white-space: nowrap;
          font-family: 'Outfit', sans-serif;
        }
        .seeva-chip:hover {
          background: #6F7F33;
          color: #ffffff;
          border-color: #6F7F33;
          transform: translateY(-1px);
        }

        /* ── Input Area ── */
        .seeva-input-area {
          padding: 16px 20px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 10px;
          align-items: center;
          flex-shrink: 0;
        }
        .seeva-input {
          flex: 1;
          padding: 12px 18px;
          border: 1.5px solid #e2e8f0;
          border-radius: 100px;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'Outfit', sans-serif;
          background: #f8fafc;
          color: #1e293b;
        }
        .seeva-input:focus {
          border-color: #6F7F33;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(111, 127, 51, 0.1);
        }
        .seeva-input::placeholder { color: #94a3b8; }
        .seeva-send-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6F7F33 0%, #8fa03e 100%);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(111, 127, 51, 0.35);
        }
        .seeva-send-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 18px rgba(111, 127, 51, 0.5);
        }
        .seeva-send-btn svg {
          width: 18px;
          height: 18px;
          fill: none;
          stroke: #ffffff;
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* ── Powered By Footer ── */
        .seeva-powered {
          padding: 8px 20px 12px;
          text-align: center;
          font-size: 0.68rem;
          color: #94a3b8;
          background: #ffffff;
          flex-shrink: 0;
        }
        .seeva-powered span {
          color: #6F7F33;
          font-weight: 600;
        }

        /* ── Mobile Responsive ── */
        @media (max-width: 480px) {
          .seeva-panel {
            width: 100vw;
          }
          .seeva-fab {
            bottom: 20px;
            right: 20px;
            width: 54px;
            height: 54px;
          }
        }
      `}} />

      {/* Floating Action Button */}
      <button
        className="seeva-fab"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Assistant"
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <span className="seeva-fab-pulse" />
        <svg viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="seeva-backdrop"
          onClick={() => setIsOpen(false)}
          aria-label="Close AI Assistant"
        />
      )}

      {/* Full Right Side Panel */}
      {isOpen && (
        <div className="seeva-panel" role="dialog" aria-label="Seevora AI Assistant">

          {/* Header */}
          <div className="seeva-panel-header">
            <div className="seeva-panel-header-left">
              <div className="seeva-panel-avatar">S</div>
              <div className="seeva-panel-header-info">
                <h3>Seevora — AI Assistant</h3>
                <p>
                  <span className="seeva-online-dot" />
                  Online · Typically replies instantly
                </p>
              </div>
            </div>
            <button className="seeva-panel-close" onClick={() => setIsOpen(false)} aria-label="Close">
              <svg viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Welcome Banner */}
          <div className="seeva-welcome-banner">
            <p>👋 Ask me anything about Seevora's AI automation, pricing, deployment, or how we serve your industry!</p>
          </div>

          {/* Messages Area */}
          <div className="seeva-panel-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`seeva-msg-row ${msg.sender}`}>
                {msg.sender === 'bot' && (
                  <div className="seeva-msg-meta">
                    <div className="seeva-msg-bot-icon">S</div>
                    <span className="seeva-msg-bot-name">Seevora AI</span>
                  </div>
                )}
                <div className="seeva-bubble">{msg.text}</div>
                <div className="seeva-msg-time">{msg.time}</div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="seeva-msg-row bot">
                <div className="seeva-msg-meta">
                  <div className="seeva-msg-bot-icon">S</div>
                  <span className="seeva-msg-bot-name">Seevora AI</span>
                </div>
                <div className="seeva-bubble">
                  <div className="seeva-typing-bubble">
                    <span className="seeva-typing-dot" />
                    <span className="seeva-typing-dot" />
                    <span className="seeva-typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          <div className="seeva-suggestions">
            {SUGGESTED_QUESTIONS.map(q => (
              <button
                key={q}
                className="seeva-chip"
                onClick={() => handleSendMessage(q)}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form
            className="seeva-input-area"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="seeva-input"
              placeholder="Ask me anything about Seevora..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" className="seeva-send-btn" aria-label="Send">
              <svg viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>

          {/* Powered By */}
          <div className="seeva-powered">
            Powered by <span>Seevora AI</span> · Enterprise Automation Platform
          </div>
        </div>
      )}
    </>
  );
}
