# Implementation Plan: AI Sales Agent

## Overview

This implementation plan converts the AI Sales Agent design into discrete, actionable coding tasks. The feature will be implemented incrementally, starting with database schema and backend infrastructure, followed by API endpoints, frontend components, and finally integration and testing.

The implementation follows a layered approach:
1. **Foundation Layer**: Database schema and core backend utilities
2. **API Layer**: Express routes and business logic
3. **Frontend Layer**: React components and state management
4. **Integration Layer**: Connect all components and add analytics
5. **Admin Layer**: Dashboard and management interface

Each task builds on previous tasks, ensuring no orphaned code and maintaining a working system at each checkpoint.

## Tasks

- [x] 1. Set up database schema and migrations
  - [x] 1.1 Create database migration file for sales agent tables
    - Create migration file in `server/db/migrations/` directory
    - Define all four tables: `sales_agent_sessions`, `sales_agent_messages`, `sales_agent_leads`, `sales_agent_analytics`
    - Include all indexes as specified in design document
    - Add foreign key constraints with CASCADE rules
    - Insert default system prompt into `system_settings` table
    - _Requirements: 9.1, 9.3_

  - [x] 1.2 Write database initialization script
    - Update `server/db/init.js` to run sales agent migrations
    - Add error handling for migration failures
    - Ensure idempotent execution (safe to run multiple times)
    - _Requirements: 9.1_

  - [x] 1.3 Write unit tests for database schema
    - Test table creation and indexes
    - Test foreign key constraints
    - Test data insertion and retrieval
    - _Requirements: 9.1_

- [ ] 2. Checkpoint - Verify database setup
  - Run migration script and verify all tables created
  - Check that indexes are properly created
  - Verify system_settings entry for AI prompt
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Implement core backend services
  - [ ] 3.1 Create Session Manager service
    - Create file `server/services/salesAgent/sessionManager.js`
    - Implement session creation with UUID generation
    - Implement session retrieval by session_id
    - Implement session archival logic (24-hour expiry)
    - Add visitor tracking (IP, user agent, visitor ID)
    - Include connection pooling for database queries
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 3.2 Create Response Generator service
    - Create file `server/services/salesAgent/responseGenerator.js`
    - Implement prompt construction with system prompt + history + current message
    - Integrate with existing `server/utils/ai.js` `generateAIReply` function
    - Implement 5-second timeout for AI calls
    - Add retry logic for network errors
    - Format response for consistent output
    - _Requirements: 2.2, 7.4, 11.4, 12.1, 12.3, 12.4_

  - [ ] 3.3 Create Lead Processor service
    - Create file `server/services/salesAgent/leadProcessor.js`
    - Implement email validation (regex pattern)
    - Implement duplicate lead detection by session
    - Implement lead insertion into database
    - Add lead-session linking logic
    - _Requirements: 5.4, 5.5_

  - [ ] 3.4 Create Analytics Tracker service
    - Create file `server/services/salesAgent/analyticsTracker.js`
    - Implement event logging (session_start, message_sent, agent_response, etc.)
    - Add conversation metrics calculation
    - Implement service discussion tracking
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 3.5 Implement Rate Limiter utility
    - Create file `server/utils/rateLimiter.js`
    - Implement in-memory Map for request tracking
    - Add cleanup logic for old entries
    - Configure 20 messages per minute per session limit
    - _Requirements: 11.1, 11.2_

  - [ ] 3.6 Write unit tests for backend services
    - Test Session Manager CRUD operations
    - Test Response Generator prompt construction
    - Test Lead Processor validation logic
    - Test Analytics Tracker event recording
    - Test Rate Limiter enforcement
    - _Requirements: 3.1, 4.1, 5.1, 8.1, 11.1_

- [ ] 4. Checkpoint - Verify backend services
  - Test each service independently with mock data
  - Verify AI integration with test prompts
  - Check rate limiter functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement API endpoints
  - [ ] 5.1 Create sales agent router file
    - Create file `server/routes/salesAgent.js`
    - Set up Express router with base path `/api/sales-agent`
    - Import all service modules
    - Add error handling middleware
    - _Requirements: 9.2_

  - [ ] 5.2 Implement GET /api/sales-agent/session endpoint
    - Handle session creation with UUID
    - Implement session retrieval by sessionId query param
    - Add session restoration logic for expired sessions
    - Generate welcome message (static or AI-generated)
    - Return session data with message history
    - _Requirements: 1.3, 6.1, 6.2, 6.4_

  - [ ] 5.3 Implement POST /api/sales-agent/message endpoint
    - Validate request body (sessionId, message)
    - Check message length limit (500 chars)
    - Enforce rate limiting
    - Store user message in database
    - Retrieve last 10 messages for context
    - Call Response Generator service
    - Store agent response in database
    - Update session last_activity_at timestamp
    - Track analytics event
    - Return agent response with metadata
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 8.2, 11.4_

  - [ ] 5.4 Implement POST /api/sales-agent/lead endpoint
    - Validate request body (name, email, phone, serviceInterest)
    - Check for duplicate lead by session
    - Call Lead Processor service
    - Update session lead_captured flag
    - Track lead_captured analytics event
    - Return success response
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 8.3_

  - [ ] 5.5 Implement POST /api/sales-agent/session/end endpoint
    - Validate sessionId
    - Update session status to 'ended'
    - Record end timestamp
    - Track session_end analytics event
    - Return success response
    - _Requirements: 8.2_

  - [ ] 5.6 Write integration tests for API endpoints
    - Test session creation and retrieval
    - Test message exchange flow
    - Test lead submission with validation
    - Test rate limiting behavior
    - Test error responses (400, 404, 429, 500, 504)
    - _Requirements: 2.2, 5.4, 11.1, 11.4_

- [ ] 6. Checkpoint - Verify API layer
  - Test all endpoints with Postman or curl
  - Verify database persistence
  - Check error handling
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Register sales agent routes in main server
  - [ ] 7.1 Import and mount sales agent router
    - Update `server/index.js` to import `salesAgent` router
    - Mount router at `/api/sales-agent`
    - Verify no route conflicts with existing endpoints
    - _Requirements: 9.2_

- [ ] 8. Implement frontend components - Foundation
  - [ ] 8.1 Create TypeScript type definitions
    - Create file `src/types/salesAgent.ts` (or `.js` with JSDoc)
    - Define Message, Session, Lead, AnalyticsEvent interfaces
    - Export all types for component use
    - _Requirements: 1.1, 2.1_

  - [ ] 8.2 Create ChatWidget component
    - Create file `src/components/SalesAgent/ChatWidget.jsx`
    - Implement floating button (bottom-right, z-index 1000)
    - Add expand/collapse toggle functionality
    - Implement unread message indicator
    - Persist state in localStorage
    - Add responsive styling (mobile and desktop)
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [ ] 8.3 Create TypingIndicator component
    - Create file `src/components/SalesAgent/TypingIndicator.jsx`
    - Implement animated "..." indicator
    - Style as agent message bubble
    - _Requirements: 2.4_

  - [ ] 8.4 Write unit tests for foundation components
    - Test ChatWidget expand/collapse
    - Test localStorage persistence
    - Test TypingIndicator rendering
    - _Requirements: 1.1, 2.4_

- [ ] 9. Implement frontend components - Messaging
  - [ ] 9.1 Create MessageBubble component
    - Create file `src/components/SalesAgent/MessageBubble.jsx`
    - Implement user vs agent styling (alignment, colors)
    - Add timestamp display
    - Support basic markdown formatting in agent messages
    - _Requirements: 2.1, 2.3, 2.5_

  - [ ] 9.2 Create MessageList component
    - Create file `src/components/SalesAgent/MessageList.jsx`
    - Implement scrollable message container
    - Add auto-scroll to bottom on new messages
    - Display MessageBubble components for each message
    - Show TypingIndicator when isTyping prop is true
    - _Requirements: 2.3, 2.4, 2.5_

  - [ ] 9.3 Create ChatInput component
    - Create file `src/components/SalesAgent/ChatInput.jsx`
    - Implement text input with send button
    - Add Enter key submission (Shift+Enter for newline)
    - Implement character limit (500 chars) with indicator
    - Add disabled state during AI response
    - Auto-focus input on mount
    - _Requirements: 2.1_

  - [ ] 9.4 Write unit tests for messaging components
    - Test MessageBubble rendering for user/agent
    - Test MessageList auto-scroll
    - Test ChatInput character limit
    - Test ChatInput keyboard shortcuts
    - _Requirements: 2.1, 2.3, 2.5_

- [ ] 10. Implement frontend components - Lead Capture
  - [ ] 10.1 Create LeadCaptureForm component
    - Create file `src/components/SalesAgent/LeadCaptureForm.jsx`
    - Implement form fields (name, email, phone, serviceInterest)
    - Add real-time validation (email format, required fields)
    - Implement submit with loading state
    - Add cancel button
    - Display validation errors inline
    - _Requirements: 5.2, 5.3, 5.4, 5.6_

  - [ ] 10.2 Write unit tests for LeadCaptureForm
    - Test form validation
    - Test error display
    - Test submission flow
    - _Requirements: 5.4_

- [ ] 11. Implement ChatWindow component - Integration
  - [ ] 11.1 Create ChatWindow component
    - Create file `src/components/SalesAgent/ChatWindow.jsx`
    - Compose MessageList, ChatInput, LeadCaptureForm components
    - Implement session management (fetch or create)
    - Add message state management
    - Implement API integration for sending messages
    - Add error handling and display
    - Implement typing indicator during AI response
    - Handle lead form display and submission
    - Add window sizing (400px × 600px desktop, fullscreen mobile)
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 5.1, 5.2, 6.1, 6.2_

  - [ ] 11.2 Write integration tests for ChatWindow
    - Test session creation on mount
    - Test message sending and receiving
    - Test lead form submission
    - Test error handling
    - _Requirements: 2.1, 2.2, 5.1, 6.1_

- [ ] 12. Checkpoint - Verify frontend components
  - Test ChatWidget visibility and toggle
  - Test message exchange UI flow
  - Test lead form validation and submission
  - Check responsive design on mobile and desktop
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Integrate ChatWidget into main application
  - [ ] 13.1 Add ChatWidget to App.jsx
    - Import ChatWidget component into `src/App.jsx`
    - Render ChatWidget at root level (visible on all pages)
    - Ensure proper z-index layering
    - _Requirements: 1.1, 9.2_

  - [ ] 13.2 Add global styles for sales agent components
    - Create or update global CSS file
    - Add styles for chat widget positioning
    - Ensure mobile responsiveness
    - _Requirements: 1.1_

- [ ] 14. Implement admin dashboard endpoints
  - [ ] 14.1 Implement GET /api/sales-agent/admin/dashboard endpoint
    - Add authentication middleware (existing auth system)
    - Query database for conversation metrics
    - Calculate conversion rate
    - Aggregate services discussed
    - Group conversations by day
    - Return dashboard analytics
    - _Requirements: 10.1, 10.2_

  - [ ] 14.2 Implement GET /api/sales-agent/admin/conversations/:sessionId endpoint
    - Add authentication middleware
    - Retrieve conversation by session ID
    - Fetch all messages for conversation
    - Include lead data if captured
    - Calculate conversation analytics
    - Return complete conversation data
    - _Requirements: 10.4_

  - [ ] 14.3 Implement PUT /api/sales-agent/admin/prompt endpoint
    - Add authentication and admin role check
    - Validate prompt content
    - Update system_settings table
    - Return success response
    - _Requirements: 12.5_

  - [ ] 14.4 Write integration tests for admin endpoints
    - Test dashboard data aggregation
    - Test conversation retrieval
    - Test system prompt update
    - Test authentication and authorization
    - _Requirements: 10.1, 10.2, 10.4, 12.5_

- [ ] 15. Implement admin dashboard frontend
  - [ ] 15.1 Create AdminDashboard component
    - Create file `src/components/Admin/SalesAgentDashboard.jsx`
    - Display conversation metrics (total, active, conversion rate)
    - Show top services chart or list
    - Display conversations by day chart
    - Add date range filter
    - _Requirements: 10.2_

  - [ ] 15.2 Create ConversationViewer component
    - Create file `src/components/Admin/ConversationViewer.jsx`
    - Display complete conversation history
    - Show lead information if captured
    - Display conversation analytics
    - Add flag/review functionality
    - _Requirements: 10.4, 10.5_

  - [ ] 15.3 Create PromptEditor component
    - Create file `src/components/Admin/PromptEditor.jsx`
    - Display current system prompt in textarea
    - Add save button with confirmation
    - Show success/error messages
    - _Requirements: 12.5_

  - [ ] 15.4 Write integration tests for admin dashboard
    - Test dashboard rendering
    - Test conversation viewer
    - Test prompt editor
    - _Requirements: 10.2, 10.4, 12.5_

- [ ] 16. Checkpoint - Verify admin functionality
  - Test admin dashboard metrics display
  - Test conversation viewing
  - Test system prompt update
  - Verify authentication and authorization
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Implement session cleanup and archival
  - [ ] 17.1 Create session cleanup utility
    - Create file `server/utils/sessionCleanup.js`
    - Implement cleanup logic for sessions older than 24 hours
    - Update session status to 'archived'
    - Set archived_at timestamp
    - _Requirements: 6.5_

  - [ ] 17.2 Add scheduled cleanup task
    - Update `server/index.js` to run cleanup on interval
    - Schedule cleanup to run every hour
    - Add logging for cleanup operations
    - _Requirements: 6.5_

  - [ ] 17.3 Write unit tests for cleanup utility
    - Test session expiry detection
    - Test archival logic
    - Test scheduled execution
    - _Requirements: 6.5_

- [ ] 18. Implement error handling and logging
  - [ ] 18.1 Add comprehensive error handling to all API endpoints
    - Implement try-catch blocks in all route handlers
    - Return appropriate HTTP status codes
    - Include error codes and messages as per design
    - Log errors with context (session ID, timestamp)
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 18.2 Implement frontend error handling
    - Add error state management in ChatWindow
    - Display user-friendly error messages
    - Implement retry functionality
    - Handle session expiry gracefully
    - Add timeout handling (show message after 3 seconds)
    - _Requirements: 2.2, 6.4_

  - [ ] 18.3 Add graceful degradation for AI service failures
    - Detect AI service unavailable (503)
    - Display fallback contact information
    - Implement localStorage caching for unsaved messages
    - _Requirements: 7.4, 11.4_

- [ ] 19. Implement conversation context management
  - [ ] 19.1 Add conversation history retrieval to Response Generator
    - Modify `responseGenerator.js` to fetch last 10 messages
    - Format messages for AI prompt context
    - Implement prompt construction with system + history + current message
    - _Requirements: 12.2, 12.3_

  - [ ] 19.2 Implement service catalog caching
    - Create service catalog data structure or load from database
    - Cache service information in memory
    - Include service info in AI prompts when relevant
    - _Requirements: 3.1, 3.2, 11.5_

  - [ ] 19.3 Write integration tests for context management
    - Test conversation history retrieval
    - Test prompt construction with context
    - Test service catalog inclusion
    - _Requirements: 12.2, 12.3_

- [ ] 20. Checkpoint - Verify core functionality end-to-end
  - Open chat widget from website
  - Send messages and receive AI responses
  - Test lead form submission
  - Verify data persistence in database
  - Check error handling scenarios
  - Test admin dashboard access
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Performance optimization
  - [ ] 21.1 Implement database connection pooling
    - Configure PostgreSQL connection pool in `server/config/db.js`
    - Set appropriate pool size (10-20 connections)
    - Add connection timeout handling
    - _Requirements: 11.1, 11.2_

  - [ ] 21.2 Optimize database queries
    - Add indexes for frequently queried fields (already in schema)
    - Use prepared statements for repeated queries
    - Implement pagination for admin conversation list
    - _Requirements: 11.1, 11.2_

  - [ ] 21.3 Implement response caching where appropriate
    - Cache system prompt in memory (refresh on update)
    - Cache service catalog data
    - Implement rate limiter cleanup for old entries
    - _Requirements: 11.5, 12.5_

  - [ ] 21.4 Write performance tests
    - Test concurrent session handling (50 sessions)
    - Test response time under load
    - Test database connection pool behavior
    - _Requirements: 11.1, 11.2_

- [ ] 22. Implement analytics and monitoring
  - [ ] 22.1 Add detailed analytics event tracking
    - Track session_start events with visitor metadata
    - Track message_sent and agent_response with timestamps
    - Track lead_capture_offered and lead_captured events
    - Track session_end with duration calculation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 22.2 Implement service discussion tracking
    - Parse agent responses for service mentions
    - Update services_discussed array in session record
    - Track which services lead to conversions
    - _Requirements: 8.4_

  - [ ] 22.3 Write unit tests for analytics tracking
    - Test event recording
    - Test service tracking
    - Test metrics calculation
    - _Requirements: 8.1, 8.4_

- [ ] 23. Security and validation enhancements
  - [ ] 23.1 Implement input sanitization
    - Sanitize user messages before storing
    - Validate email format with proper regex
    - Sanitize lead form inputs
    - Prevent SQL injection with parameterized queries
    - _Requirements: 5.4, 7.1_

  - [ ] 23.2 Add rate limiting protection
    - Implement per-session rate limiting (20 msgs/min)
    - Add IP-based rate limiting for session creation
    - Return 429 status with retry-after header
    - _Requirements: 11.1_

  - [ ] 23.3 Implement session security measures
    - Generate cryptographically secure session IDs
    - Add session expiry validation
    - Implement visitor fingerprinting for tracking
    - _Requirements: 6.3, 6.4, 6.5_

  - [ ] 23.4 Write security tests
    - Test input sanitization
    - Test rate limiting enforcement
    - Test session security
    - _Requirements: 5.4, 6.5, 11.1_

- [ ] 24. Implement AI prompt engineering and safety
  - [ ] 24.1 Create default system prompt
    - Write comprehensive system prompt with company info
    - Include service catalog details
    - Define behavioral guidelines (do's and don'ts)
    - Add lead capture instructions
    - Insert into database during migration
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 12.1, 12.2_

  - [ ] 24.2 Implement AI safety guardrails
    - Add content filtering for inappropriate responses
    - Implement topic boundary enforcement
    - Add fallback responses for out-of-scope queries
    - Handle profanity and abuse gracefully
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [ ] 24.3 Write integration tests for AI responses
    - Test response quality with sample queries
    - Test safety guardrails
    - Test lead capture triggering
    - _Requirements: 3.1, 4.1, 7.1, 7.2_

- [ ] 25. Checkpoint - Security and AI quality verification
  - Test input sanitization and validation
  - Verify rate limiting works correctly
  - Test AI response quality with various queries
  - Verify safety guardrails prevent inappropriate responses
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 26. Add conversation persistence and restoration
  - [ ] 26.1 Implement localStorage session tracking in frontend
    - Store session ID in localStorage on creation
    - Restore session ID on page load
    - Clear localStorage on session end
    - _Requirements: 6.1, 6.2_

  - [ ] 26.2 Implement session restoration in backend
    - Add logic to restore sessions within 24-hour window
    - Return conversation history on restoration
    - Handle expired session gracefully
    - _Requirements: 6.4, 6.5_

  - [ ] 26.3 Write integration tests for persistence
    - Test localStorage persistence
    - Test session restoration
    - Test cross-page navigation persistence
    - _Requirements: 6.1, 6.2, 6.4_

- [ ] 27. Implement lead capture workflow
  - [ ] 27.1 Add lead capture detection logic
    - Implement heuristics to detect high-interest signals
    - Parse AI responses for lead capture suggestions
    - Trigger lead form display at appropriate times
    - _Requirements: 4.1, 5.1_

  - [ ] 27.2 Enhance lead form user experience
    - Add smooth form transition animation
    - Pre-fill known information if available
    - Show success message after submission
    - Update conversation with confirmation
    - _Requirements: 5.6_

  - [ ] 27.3 Write integration tests for lead capture
    - Test lead form triggering
    - Test form submission flow
    - Test duplicate prevention
    - _Requirements: 5.1, 5.4, 5.5_

- [ ] 28. Add mobile responsiveness and accessibility
  - [ ] 28.1 Optimize ChatWidget for mobile devices
    - Implement responsive sizing (fullscreen on mobile)
    - Add touch-friendly button sizes
    - Optimize scrolling for mobile
    - Test on various screen sizes
    - _Requirements: 1.1, 1.2_

  - [ ] 28.2 Add accessibility features
    - Add ARIA labels to all interactive elements
    - Implement keyboard navigation
    - Add screen reader support
    - Ensure proper focus management
    - _Requirements: 1.1, 2.1_

  - [ ] 28.3 Write accessibility tests
    - Test keyboard navigation
    - Test screen reader compatibility
    - Test ARIA labels
    - _Requirements: 1.1, 2.1_

- [ ] 29. Final integration and end-to-end testing
  - [ ] 29.1 Perform complete user flow testing
    - Test new visitor conversation flow
    - Test returning visitor with session restoration
    - Test lead capture and submission
    - Test admin dashboard functionality
    - Test error scenarios and edge cases
    - _Requirements: 1.1, 2.1, 5.1, 6.1, 10.1_

  - [ ] 29.2 Conduct cross-browser testing
    - Test on Chrome, Firefox, Safari, Edge
    - Test on mobile browsers (iOS Safari, Chrome)
    - Verify consistent behavior across browsers
    - _Requirements: 1.1_

  - [ ] 29.3 Write end-to-end tests
    - Test complete conversation flow
    - Test admin workflow
    - Test error recovery
    - _Requirements: 1.1, 2.1, 5.1, 10.1_

- [ ] 30. Documentation and deployment preparation
  - [ ] 30.1 Write API documentation
    - Document all endpoints with request/response examples
    - Add authentication requirements
    - Include error codes and meanings
    - Create Postman collection or OpenAPI spec
    - _Requirements: 9.2_

  - [ ] 30.2 Create deployment guide
    - Document environment variables required
    - List database migration steps
    - Add system prompt configuration instructions
    - Include monitoring and logging setup
    - _Requirements: 9.4_

  - [ ] 30.3 Create admin user guide
    - Document dashboard features
    - Explain conversation monitoring
    - Provide system prompt editing guidelines
    - Include troubleshooting section
    - _Requirements: 10.1, 10.2, 10.4, 12.5_

- [ ] 31. Final checkpoint - Production readiness
  - Verify all features working correctly
  - Confirm all tests passing
  - Review security measures
  - Check performance under load
  - Validate documentation completeness
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements from the requirements document for traceability
- Checkpoints ensure incremental validation and provide opportunities to address issues early
- The design document contains complete specifications for all components mentioned in tasks
- All database schemas, API contracts, and component interfaces are defined in the design document
- Implementation should follow existing project patterns (Express routing, React component structure, PostgreSQL queries)
- Testing tasks are marked optional but highly recommended for production quality
- Security and performance tasks should not be skipped even if marked optional

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5"] },
    { "id": 3, "tasks": ["3.6", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4", "5.5"] },
    { "id": 5, "tasks": ["5.6", "7.1"] },
    { "id": 6, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 7, "tasks": ["8.4", "9.1", "9.2", "9.3"] },
    { "id": 8, "tasks": ["9.4", "10.1"] },
    { "id": 9, "tasks": ["10.2", "11.1"] },
    { "id": 10, "tasks": ["11.2", "13.1", "13.2"] },
    { "id": 11, "tasks": ["14.1", "14.2", "14.3"] },
    { "id": 12, "tasks": ["14.4", "15.1", "15.2", "15.3"] },
    { "id": 13, "tasks": ["15.4", "17.1", "17.2"] },
    { "id": 14, "tasks": ["17.3", "18.1", "18.2", "18.3"] },
    { "id": 15, "tasks": ["19.1", "19.2"] },
    { "id": 16, "tasks": ["19.3", "21.1", "21.2", "21.3"] },
    { "id": 17, "tasks": ["21.4", "22.1", "22.2"] },
    { "id": 18, "tasks": ["22.3", "23.1", "23.2", "23.3"] },
    { "id": 19, "tasks": ["23.4", "24.1", "24.2"] },
    { "id": 20, "tasks": ["24.3", "26.1", "26.2"] },
    { "id": 21, "tasks": ["26.3", "27.1", "27.2"] },
    { "id": 22, "tasks": ["27.3", "28.1", "28.2"] },
    { "id": 23, "tasks": ["28.3", "29.1", "29.2"] },
    { "id": 24, "tasks": ["29.3", "30.1", "30.2", "30.3"] }
  ]
}
```
