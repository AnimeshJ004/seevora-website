# Database Migration Tests

This directory contains database schema migration files and their corresponding unit tests for the AI Sales Agent feature.

## Test Files

### `001_create_sales_agent_tables.test.js`

**Validates: Requirements 9.1** - Integration with Existing Systems

Comprehensive unit tests for the sales agent database schema covering:

#### Table Creation Tests
- Verifies all four tables are created: `sales_agent_sessions`, `sales_agent_messages`, `sales_agent_leads`, `sales_agent_analytics`
- Validates correct column structure and data types for each table
- Ensures all required columns are present

#### Index Creation Tests
- Confirms all performance-critical indexes are created:
  - Session lookup indexes (`idx_sessions_session_id`, `idx_sessions_status`, etc.)
  - Message retrieval indexes (`idx_messages_session_id`, `idx_messages_created_at`)
  - Lead search indexes (`idx_leads_email`, `idx_leads_status`, `idx_leads_created_at`)
  - Analytics query indexes (`idx_analytics_session_id`, `idx_analytics_event_type`, etc.)

#### Foreign Key Constraint Tests
- Validates CASCADE delete behavior:
  - Messages cascade delete when session is deleted
  - Leads cascade delete when session is deleted
  - Analytics cascade delete when session is deleted
- Validates SET NULL behavior:
  - Session `lead_id` is set to NULL when lead is deleted

#### Data Insertion and Retrieval Tests
- Session CRUD operations with default values
- Message insertion and retrieval linked to sessions
- Lead capture with validation
- Analytics event tracking
- JSONB metadata handling for complex data structures
- PostgreSQL array handling for `services_discussed`
- Unique constraint enforcement on `session_id`
- Cascade delete verification
- SET NULL foreign key behavior

## Running Tests

```bash
# Run all database tests
npm run test:db

# Run all tests
npm test

# Run specific test file
node --test server/db/migrations/001_create_sales_agent_tables.test.js
```

## Test Coverage Summary

- **Total Tests**: 21
- **Table Structure**: 4 tests
- **Index Creation**: 4 tests
- **Foreign Key Constraints**: 4 tests
- **Data Operations**: 9 tests

## Prerequisites

- PostgreSQL database running and accessible
- Environment variables configured in `.env`:
  - `DATABASE_URL` or individual `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
- Migration `001_create_sales_agent_tables.sql` already executed

## Test Strategy

Tests validate the schema exists and functions correctly. They assume the migration has already been run during application initialization, making them safe to run repeatedly without modifying the schema.

Each test is isolated and cleans up its own test data in the `after` hook to prevent interference between test runs.
