import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../../utils/apiUrl';

// Seevora knowledge base — used as offline fallback when server is unavailable
const SEEVORA_KNOWLEDGE = [
  // ── Seevora Company & Products ──
  {
    keywords: ['what is seevora', 'about seevora', 'what does seevora do', 'company', 'platform', 'product', 'explain seevora'],
    response: "Seevora is an Indian enterprise AI automation company based in Indore, Madhya Pradesh that turns manual business workflows into profit centers. We deploy AI Voice Receptionists, WhatsApp automations, custom dashboards, and multi-agent AI systems — all customized to your business in 5 days."
  },
  {
    keywords: ['b2b', 'sales automation', 'sales pipeline', 'lead generation', 'outreach', 'sales agent'],
    response: "For B2B sales, Seevora deploys AI agents that handle lead qualification, follow-up sequences, demo scheduling, and WhatsApp outreach — all automated. This shortens sales cycles and lets your team focus on closing deals instead of chasing leads."
  },
  {
    keywords: ['receptionist', 'missed call', 'phone', 'answer call', 'front desk', 'voice'],
    response: "Our 24/7 AI Voice Receptionist answers every incoming call — even after hours. It greets callers, captures their intent, books appointments directly into your calendar, and routes urgent queries. You'll never lose a customer to a missed call again."
  },
  {
    keywords: ['whatsapp', 'whatsapp automation', 'message', 'sms', 'notification', 'follow up'],
    response: "Seevora integrates with WhatsApp Business API to automate appointment confirmations, payment reminders (UPI links), document collection, follow-ups, and customer updates — all in the customer's preferred language."
  },
  {
    keywords: ['hindi', 'hinglish', 'language', 'multilingual', 'local language', 'regional'],
    response: "Seevora is Hindi-First. Our AI agents speak English, Hindi, and Hinglish naturally — matching the tone and language of your local customers. This is especially effective for Indian SMBs serving regional markets."
  },
  {
    keywords: ['price', 'pricing', 'cost', 'fee', 'how much', 'subscription', 'plan', 'charge'],
    response: "Pricing is custom-built based on the modules you need, your call volume, and integrations. Most clients see 40% operating cost reduction within 90 days. Book a free discovery call and we'll give you an exact quote tailored to your business."
  },
  {
    keywords: ['setup', 'how long', 'deploy', 'launch', 'days', 'onboard', 'start', 'implementation'],
    response: "We go live in 5 business days. Our team audits your current workflow, maps your business rules, builds the AI models, and deploys everything. After launch, we monitor and fine-tune the system continuously."
  },
  {
    keywords: ['book', 'call', 'demo', 'schedule', 'appointment', 'consult', 'meeting', 'discovery'],
    response: "Booking a discovery call is easy — click the 'Book a Call' button at the top of the page or scroll to the contact section. Our team will map your workflow and show you exactly how Seevora can automate it within 5 days."
  },
  // ── Industries ──
  {
    keywords: ['clinic', 'doctor', 'hospital', 'patient', 'medical', 'healthcare'],
    response: "For clinics and healthcare, Seevora handles missed patient calls, appointment booking into your calendar or EMR system, pre-visit reminders, and intake automation — all in the patient's preferred language."
  },
  {
    keywords: ['salon', 'studio', 'spa', 'beauty', 'no-show', 'slot', 'booking'],
    response: "For salons and studios, Seevora sends WhatsApp reminders before appointments, auto-fills cancelled slots from a waiting list, and handles new booking requests 24/7 — reducing no-shows by 30-40%."
  },
  {
    keywords: ['ca', 'consultant', 'tax', 'finance', 'legal', 'document', 'invoice', 'receipt'],
    response: "For CAs, lawyers, and consultants, Seevora automates document collection, UPI payment reminders, client follow-ups, and consultation scheduling — saving 6-8 hours of admin work per week."
  },
  {
    keywords: ['gym', 'fitness', 'yoga', 'trainer', 'renewal', 'membership', 'trial'],
    response: "For gyms and fitness centers, Seevora sends trial class follow-ups, membership renewal reminders, and session booking confirmations on WhatsApp — keeping clients engaged automatically."
  },
  {
    keywords: ['education', 'school', 'academy', 'admission', 'tuition', 'coaching', 'student'],
    response: "For education and coaching centers, Seevora handles admission inquiries via voice and WhatsApp, demo class scheduling, fee reminder sequences, and parent communication — all automated."
  },
  {
    keywords: ['real estate', 'property', 'builder', 'broker', 'site visit', 'lead'],
    response: "For real estate, Seevora qualifies incoming property inquiries, shares catalogs automatically on WhatsApp, and schedules site visits — ensuring no lead goes cold."
  },
  // ── AI & Technology Concepts ──
  {
    keywords: ['what is ai', 'artificial intelligence', 'how ai works', 'machine learning', 'deep learning', 'neural network'],
    response: "Artificial Intelligence (AI) refers to systems that can perform tasks that normally require human intelligence — like understanding language, making decisions, and recognizing patterns. Modern AI is powered by large language models (LLMs) and neural networks trained on massive datasets."
  },
  {
    keywords: ['llm', 'large language model', 'gpt', 'claude', 'chatgpt', 'generative ai'],
    response: "LLMs (Large Language Models) like Claude and GPT-4 are AI models trained on huge amounts of text. They can understand and generate human-like language, making them ideal for chatbots, voice agents, and content generation. Seevora uses these models to power our AI receptionists and sales agents."
  },
  {
    keywords: ['ai agent', 'agent', 'autonomous', 'multi-agent', 'agentic'],
    response: "An AI agent is a software system that perceives its environment, makes decisions, and takes actions autonomously to achieve a goal. Multi-agent systems use several specialized agents working together — for example, one agent handles calls, another processes WhatsApp, and another updates your CRM. This is exactly what Seevora deploys."
  },
  {
    keywords: ['automation', 'automate', 'workflow', 'rpa', 'process automation'],
    response: "Business automation uses technology to perform repetitive tasks without human intervention — things like sending reminders, collecting documents, booking appointments, and following up with clients. Seevora specializes in AI-powered automation that goes beyond simple rule-based bots to handle natural conversations."
  },
  {
    keywords: ['crm', 'customer relationship', 'salesforce', 'hubspot', 'zoho'],
    response: "A CRM (Customer Relationship Management) system tracks your customers, leads, and interactions in one place. Seevora integrates directly with popular CRMs to automatically log calls, update lead status, set follow-up reminders, and push appointment data — eliminating manual data entry."
  },
  {
    keywords: ['api', 'integration', 'webhook', 'connect', 'software integration'],
    response: "APIs (Application Programming Interfaces) allow different software systems to communicate with each other. Seevora uses APIs to connect our AI agents with your existing tools — calendar apps, CRMs, billing systems, EMRs, and WhatsApp — creating seamless automated workflows without replacing what you already use."
  },
  {
    keywords: ['chatbot', 'bot', 'virtual assistant', 'ai chat', 'conversational ai'],
    response: "Modern AI chatbots are far more sophisticated than older rule-based bots. They use NLP (natural language processing) to understand context, intent, and nuance — handling complex conversations naturally. Seevora deploys these for websites, WhatsApp, and voice channels simultaneously."
  },
  {
    keywords: ['voice ai', 'voice agent', 'speech recognition', 'text to speech', 'tts', 'stt'],
    response: "Voice AI converts spoken audio into text (STT), understands the intent, generates a response, and converts it back to speech (TTS) — all in under 2 seconds. Seevora's Voice Receptionists use this to handle real phone calls naturally in English, Hindi, and Hinglish."
  },
  // ── Sales & Business Strategy ──
  {
    keywords: ['sales strategy', 'how to sell', 'increase sales', 'sales tips', 'close deals', 'revenue'],
    response: "Effective B2B sales strategy in 2024 focuses on: (1) fast lead response time — the first to respond wins, (2) multi-channel follow-up via calls and WhatsApp, (3) personalisation at scale using AI, and (4) clear ROI demonstration. Seevora automates steps 1-3 so your team only handles step 4."
  },
  {
    keywords: ['follow up', 'follow-up', 'nurture', 'sequence', 'drip', 'pipeline'],
    response: "Follow-up is where most sales are won or lost. Studies show 80% of sales require 5+ follow-ups, but most salespeople stop after 2. Seevora automates follow-up sequences over WhatsApp and calls — consistently reaching prospects without any manual effort."
  },
  {
    keywords: ['lead', 'prospect', 'qualify', 'lead qualification', 'discovery'],
    response: "Lead qualification means identifying which prospects are genuinely interested and ready to buy. Seevora's AI agents ask discovery questions in the initial conversation, score the lead, and route high-intent prospects to your sales team — so you focus only on buyers."
  },
  {
    keywords: ['marketing', 'digital marketing', 'social media', 'content', 'seo', 'ads'],
    response: "Good marketing generates leads — but the real money is in converting them quickly. Seevora complements your marketing by ensuring every inquiry gets an instant, intelligent response via voice or WhatsApp, dramatically improving your marketing ROI by capturing leads you'd otherwise lose."
  },
  {
    keywords: ['roi', 'return on investment', 'benefit', 'value', 'impact', 'result'],
    response: "Seevora customers typically see: 30-50% reduction in missed customer inquiries, 30-40% reduction in appointment no-shows, 40% reduction in operating costs, and 6-8 hours saved per week per staff member — usually within the first 90 days of deployment."
  },
  {
    keywords: ['startup', 'smb', 'small business', 'scale', 'grow', 'expansion'],
    response: "For growing SMBs, automation is the fastest way to scale without proportionally increasing headcount. Seevora lets you handle 3x the customer volume with your existing team by automating all repetitive customer-facing tasks — calls, reminders, follow-ups, and document collection."
  },
  {
    keywords: ['upi', 'payment', 'billing', 'invoice', 'collection', 'outstanding'],
    response: "Seevora automates payment follow-ups via WhatsApp — sending polite reminders with UPI payment links at the right intervals. This improves collections without awkward phone calls and typically reduces outstanding invoices by 25-35%."
  },
];

const SUGGESTED_QUESTIONS = [
  "What does Seevora do?",
  "What is an AI agent?",
  "How do you automate B2B sales?",
  "How fast can you deploy?",
  "What is WhatsApp automation?",
  "Tell me about pricing",
  "How does AI voice receptionist work?",
  "What industries do you serve?"
];

async function chatbotFetch(endpoint, options) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 9000);
  const requestOptions = { ...options, signal: controller.signal };

  try {
    const response = await fetch(apiUrl(endpoint), requestOptions);
    if (response.ok) return response;
  } catch {
    // Fall back to local canned replies.
  } finally {
    window.clearTimeout(timeout);
  }

  throw new Error('Chatbot API unavailable');
}

function getLocalBotResponse(text) {
  const query = text.toLowerCase().trim();

  // ── Conversational / Greeting ──
  const greetings = ['hi', 'hello', 'hey', 'greetings', 'hola', 'yo', 'good morning', 'good afternoon', 'good evening', 'namaste', 'namaskar', 'jai hind'];
  const isGreeting = greetings.some(g => query === g || query.startsWith(g + ' ') || query.endsWith(' ' + g));
  if (isGreeting) {
    return "Hi! I'm Seevora AI — your business automation advisor. Ask me anything about sales, AI, business strategy, or how Seevora can automate your workflows. I'm here to help!";
  }

  if (/\b(how are you|how r you|kaise ho|kya haal|what'?s up|sup|theek ho)\b/.test(query)) {
    return "Doing great, thanks for asking! I'm ready to help you with anything — Seevora's services, AI automation, sales strategy, or general business questions. What's on your mind?";
  }

  if (/\b(thanks|thank you|thankyou|dhanyavad|shukriya|bahut achha|great|awesome)\b/.test(query)) {
    return "You're welcome! Feel free to ask anything else — about Seevora, AI, business automation, or anything you need help with.";
  }

  if (/\b(who are you|your name|are you ai|are you a bot|what are you)\b/.test(query)) {
    return "I'm Seevora AI — an intelligent business advisor trained to help you with AI automation, sales strategy, business operations, and everything about Seevora's products. What would you like to know?";
  }

  if (/\b(help|what can you do|can you help|capabilities)\b/.test(query)) {
    return "I can help you with: Seevora's products and pricing, AI and automation concepts, B2B sales strategies, business operations, workflow automation, and general business questions. Just ask away!";
  }

  // ── Knowledge base match ──
  const matched = SEEVORA_KNOWLEDGE.find(item =>
    item.keywords.some(keyword => query.includes(keyword))
  );
  if (matched) return matched.response;

  // ── AI & Technology general fallbacks ──
  if (/\b(ai|artificial intelligence|machine learning|deep learning|neural|llm|gpt|claude)\b/.test(query)) {
    return "AI (Artificial Intelligence) enables machines to understand language, make decisions, and automate complex tasks. Seevora uses AI to power voice receptionists, WhatsApp automation, and multi-agent sales pipelines — purpose-built for Indian SMBs.";
  }

  if (/\b(crm|salesforce|hubspot|zoho|customer management)\b/.test(query)) {
    return "A CRM helps you track customers, leads, and interactions in one place. Seevora integrates directly with your CRM — automatically logging calls, updating lead status, and setting follow-up reminders without any manual data entry.";
  }

  if (/\b(sales|revenue|leads|pipeline|conversion|close)\b/.test(query)) {
    return "The fastest way to improve sales is faster lead response + consistent follow-up. Seevora automates both — answering leads instantly via voice and WhatsApp, then following up in a structured sequence until they convert.";
  }

  if (/\b(automation|automate|workflow|process|manual|repetitive)\b/.test(query)) {
    return "Business automation removes manual, repetitive work from your team's plate — things like sending reminders, collecting documents, following up with clients, and booking appointments. Seevora specializes in AI-powered automation tailored to your specific business rules.";
  }

  if (/\b(marketing|seo|ads|social media|content|brand)\b/.test(query)) {
    return "Great marketing drives traffic — but converting those leads quickly is where revenue is made. Seevora ensures every marketing-generated inquiry gets an instant intelligent response, maximizing your marketing ROI.";
  }

  if (/\b(roi|cost|saving|benefit|result|impact|outcome)\b/.test(query)) {
    return "Seevora customers typically see 40% operating cost reduction and 30-50% fewer missed inquiries within 90 days. Most clients recover the investment cost in the first month through saved staff hours and recovered lost leads.";
  }

  // ── Smart general fallback ──
  let cleanTopic = query;
  const prefixes = [
    'tell me about', 'tell me more about', 'can you explain', 'can you tell me about',
    'how does', 'how do', 'do you support', 'do you have',
    'what is', 'what are', 'information on', 'i want to know about', 'explain',
    'how to', 'please', 'show me', 'about'
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
    return `Great question about ${topic}! I'm currently in offline mode and can't give you a full AI answer — but Seevora's team is expert at applying AI automation to exactly these kinds of business challenges. Book a free call and let's discuss it: click 'Book a Call' at the top of the page.`;
  }

  return "I'm currently in offline mode but I'm happy to help! You can reach Seevora's team directly at contact@seevora.in, or click 'Book a Call' at the top of the page for a free discovery session.";
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
          background: linear-gradient(135deg, #9CA3AF 0%, #4B5563 100%);
          border: none;
          box-shadow: 0 8px 32px rgba(156, 163, 175, 0.5), 0 2px 8px rgba(0,0,0,0.15);
          cursor: pointer;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s;
        }
        .seeva-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 40px rgba(156, 163, 175, 0.6), 0 4px 12px rgba(0,0,0,0.2);
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
          background: #9CA3AF;
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
          background: linear-gradient(135deg, #9CA3AF 0%, #4B5563 100%);
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
          background: #9CA3AF;
          box-shadow: 0 0 6px #9CA3AF;
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
          border-bottom: 1px solid #c7e8f4;
          flex-shrink: 0;
        }
        .seeva-welcome-banner p {
          font-size: 0.8rem;
          color: #0f2742;
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
          background: linear-gradient(135deg, #9CA3AF, #4B5563);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
        }
        .seeva-msg-bot-name {
          font-size: 0.7rem;
          font-weight: 600;
          color: #9CA3AF;
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
          background: linear-gradient(135deg, #9CA3AF 0%, #4B5563 100%);
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
          border: 1.5px solid rgba(156, 163, 175, 0.4);
          border-radius: 100px;
          font-size: 0.75rem;
          color: #9CA3AF;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          flex-shrink: 0;
          white-space: nowrap;
          font-family: 'Outfit', sans-serif;
        }
        .seeva-chip:hover {
          background: #9CA3AF;
          color: #ffffff;
          border-color: #9CA3AF;
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
          border-color: #9CA3AF;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.1);
        }
        .seeva-input::placeholder { color: #94a3b8; }
        .seeva-send-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #9CA3AF 0%, #4B5563 100%);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(156, 163, 175, 0.35);
        }
        .seeva-send-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 18px rgba(156, 163, 175, 0.5);
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
          color: #9CA3AF;
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
