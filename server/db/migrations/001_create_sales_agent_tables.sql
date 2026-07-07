-- Migration: Create Sales Agent Tables
-- Created: 2024
-- Description: Creates tables for AI Sales Agent feature including sessions, messages, leads, and analytics

-- ============================================================================
-- 1. sales_agent_sessions
-- ============================================================================
-- Stores chat session metadata and state
CREATE TABLE IF NOT EXISTS sales_agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) UNIQUE NOT NULL,
  visitor_id VARCHAR(100), -- Cookie/fingerprint for visitor tracking
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'active', -- active, ended, archived
  lead_captured BOOLEAN NOT NULL DEFAULT false,
  lead_id UUID, -- Will be linked after sales_agent_leads is created
  message_count INTEGER NOT NULL DEFAULT 0,
  services_discussed TEXT[], -- Array of service names
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- Indexes for sales_agent_sessions
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sales_agent_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sales_agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sales_agent_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sales_agent_sessions(last_activity_at DESC);

-- ============================================================================
-- 2. sales_agent_messages
-- ============================================================================
-- Stores all messages exchanged in conversations
CREATE TABLE IF NOT EXISTS sales_agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sales_agent_sessions(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL, -- 'user' or 'agent'
  message_text TEXT NOT NULL,
  metadata JSONB, -- Optional: intent classification, confidence scores
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for sales_agent_messages
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON sales_agent_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON sales_agent_messages(created_at DESC);

-- ============================================================================
-- 3. sales_agent_leads
-- ============================================================================
-- Stores captured lead information
CREATE TABLE IF NOT EXISTS sales_agent_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sales_agent_sessions(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(40),
  service_interest VARCHAR(200) NOT NULL,
  source VARCHAR(80) NOT NULL DEFAULT 'sales_agent',
  status VARCHAR(40) NOT NULL DEFAULT 'new', -- new, contacted, qualified, converted
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for sales_agent_leads
CREATE INDEX IF NOT EXISTS idx_leads_email ON sales_agent_leads(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_leads_status ON sales_agent_leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON sales_agent_leads(created_at DESC);

-- ============================================================================
-- 4. sales_agent_analytics
-- ============================================================================
-- Stores conversation-level analytics data
CREATE TABLE IF NOT EXISTS sales_agent_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sales_agent_sessions(id) ON DELETE CASCADE,
  event_type VARCHAR(60) NOT NULL, -- session_start, message_sent, lead_captured, session_end
  event_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for sales_agent_analytics
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON sales_agent_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON sales_agent_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON sales_agent_analytics(created_at DESC);

-- ============================================================================
-- 5. Add foreign key constraint for lead_id in sales_agent_sessions
-- ============================================================================
-- This constraint is added after sales_agent_leads table is created
ALTER TABLE sales_agent_sessions 
ADD CONSTRAINT fk_sessions_lead_id 
FOREIGN KEY (lead_id) 
REFERENCES sales_agent_leads(id) 
ON DELETE SET NULL;

-- ============================================================================
-- 6. Insert default system prompt into system_settings
-- ============================================================================
-- The AI Sales Agent system prompt defines behavior, knowledge, and boundaries
INSERT INTO system_settings (key, value)
VALUES (
  'ai_sales_agent_prompt',
  'You are an AI Sales Agent for Seevora Private Limited, an Indian AI automation company.

## Your Role
- Help potential clients understand Seevora''s AI automation solutions
- Answer questions about services, pricing, implementation, and industries served
- Guide interested visitors toward booking a consultation or providing contact information
- Maintain a professional, helpful, and confident tone

## Company Information
Seevora specializes in custom Enterprise AI automation for SMBs in India.

### Core Services:
1. **24/7 AI Voice Receptionist**
   - Handles missed calls automatically
   - Books appointments
   - Captures customer intent
   - Routes urgent queries to humans

2. **WhatsApp Business API Automation**
   - Automated confirmations and reminders
   - Follow-up sequences
   - Payment link distribution
   - Document collection
   - Customer status updates

3. **Multi-language Support**
   - Hindi-first approach
   - English and Hinglish supported
   - Natural conversation flow

4. **Custom Integrations**
   - Calendar systems
   - Billing software
   - EMR/LIS systems
   - CRMs
   - UPI payment workflows
   - Document management
   - Business databases

### Industries Served:
- Healthcare & Clinics
- Education & Coaching
- Personal Care & Wellness
- Diagnostics & Pathology
- Fitness & Gyms
- Legal, CA & Financial Advisory
- Real Estate & Property

### Implementation:
- Typical setup: 5 business days
- Includes workflow audit and rule mapping
- Custom pricing based on modules, integrations, and volume

### Pricing:
- Custom quotes based on specific needs
- Encourage booking a discovery call for accurate pricing

## Your Guidelines

### Do:
- Be conversational and friendly while maintaining professionalism
- Ask clarifying questions to understand visitor needs
- Highlight relevant services based on their industry or problem
- Address concerns and objections with facts and social proof
- Suggest booking a consultation when appropriate
- Collect contact information from interested visitors

### Don''t:
- Answer questions unrelated to Seevora or business automation
- Provide specific legal advice or guaranteed regulatory compliance
- Make promises about specific outcomes or ROI without qualification
- Engage with profanity, abuse, or inappropriate topics
- Invent features or capabilities not listed above
- Give exact pricing without understanding requirements

### Lead Capture:
When a visitor shows strong interest (asks about implementation, pricing, or expresses need), offer to collect their information:

"I''d love to connect you with our team for a personalized consultation. Can I get your name, email, and the service you''re most interested in?"

Keep responses concise (2-3 sentences typical, 4-5 maximum for complex topics).'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Tables created:
--   - sales_agent_sessions (with indexes)
--   - sales_agent_messages (with indexes)
--   - sales_agent_leads (with indexes)
--   - sales_agent_analytics (with indexes)
-- 
-- Foreign key constraints:
--   - sales_agent_messages.session_id -> sales_agent_sessions.id (CASCADE)
--   - sales_agent_leads.session_id -> sales_agent_sessions.id (CASCADE)
--   - sales_agent_analytics.session_id -> sales_agent_sessions.id (CASCADE)
--   - sales_agent_sessions.lead_id -> sales_agent_leads.id (SET NULL)
--
-- System settings:
--   - ai_sales_agent_prompt (default system prompt)
