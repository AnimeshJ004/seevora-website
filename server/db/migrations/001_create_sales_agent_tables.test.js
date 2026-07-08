import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

/**
 * Unit Tests for Database Schema (001_create_sales_agent_tables.sql)
 * 
 * **Validates: Requirements 9.1**
 * 
 * Tests cover:
 * - Table creation and structure
 * - Index creation
 * - Foreign key constraints
 * - Data insertion and retrieval
 * - Constraint validation
 */

describe('Database Schema - Sales Agent Tables', () => {
  let pool;
  let testSessionId;
  let testLeadId;

  before(async () => {
    // Create a new pool for testing
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
    });

    // Note: Migration is assumed to have already been run during app initialization
    // The test validates the schema exists and works correctly, not re-running migration
  });

  after(async () => {
    // Clean up test data
    if (testSessionId) {
      await pool.query('DELETE FROM sales_agent_sessions WHERE id = $1', [testSessionId]);
    }
    if (testLeadId) {
      await pool.query('DELETE FROM sales_agent_leads WHERE id = $1', [testLeadId]);
    }
    await pool.end();
  });

  describe('Table Creation', () => {
    it('should create sales_agent_sessions table with correct structure', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'sales_agent_sessions'
        ORDER BY ordinal_position
      `);

      assert.ok(result.rows.length > 0, 'sales_agent_sessions table should exist');

      const columns = result.rows.map(r => r.column_name);
      assert.ok(columns.includes('id'), 'should have id column');
      assert.ok(columns.includes('session_id'), 'should have session_id column');
      assert.ok(columns.includes('visitor_id'), 'should have visitor_id column');
      assert.ok(columns.includes('ip_address'), 'should have ip_address column');
      assert.ok(columns.includes('user_agent'), 'should have user_agent column');
      assert.ok(columns.includes('status'), 'should have status column');
      assert.ok(columns.includes('lead_captured'), 'should have lead_captured column');
      assert.ok(columns.includes('lead_id'), 'should have lead_id column');
      assert.ok(columns.includes('message_count'), 'should have message_count column');
      assert.ok(columns.includes('services_discussed'), 'should have services_discussed column');
      assert.ok(columns.includes('last_activity_at'), 'should have last_activity_at column');
      assert.ok(columns.includes('created_at'), 'should have created_at column');
      assert.ok(columns.includes('ended_at'), 'should have ended_at column');
      assert.ok(columns.includes('archived_at'), 'should have archived_at column');
    });

    it('should create sales_agent_messages table with correct structure', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'sales_agent_messages'
        ORDER BY ordinal_position
      `);

      assert.ok(result.rows.length > 0, 'sales_agent_messages table should exist');

      const columns = result.rows.map(r => r.column_name);
      assert.ok(columns.includes('id'), 'should have id column');
      assert.ok(columns.includes('session_id'), 'should have session_id column');
      assert.ok(columns.includes('sender'), 'should have sender column');
      assert.ok(columns.includes('message_text'), 'should have message_text column');
      assert.ok(columns.includes('metadata'), 'should have metadata column');
      assert.ok(columns.includes('created_at'), 'should have created_at column');
    });

    it('should create sales_agent_leads table with correct structure', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'sales_agent_leads'
        ORDER BY ordinal_position
      `);

      assert.ok(result.rows.length > 0, 'sales_agent_leads table should exist');

      const columns = result.rows.map(r => r.column_name);
      assert.ok(columns.includes('id'), 'should have id column');
      assert.ok(columns.includes('session_id'), 'should have session_id column');
      assert.ok(columns.includes('name'), 'should have name column');
      assert.ok(columns.includes('email'), 'should have email column');
      assert.ok(columns.includes('phone'), 'should have phone column');
      assert.ok(columns.includes('service_interest'), 'should have service_interest column');
      assert.ok(columns.includes('source'), 'should have source column');
      assert.ok(columns.includes('status'), 'should have status column');
      assert.ok(columns.includes('notes'), 'should have notes column');
      assert.ok(columns.includes('created_at'), 'should have created_at column');
      assert.ok(columns.includes('updated_at'), 'should have updated_at column');
    });

    it('should create sales_agent_analytics table with correct structure', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'sales_agent_analytics'
        ORDER BY ordinal_position
      `);

      assert.ok(result.rows.length > 0, 'sales_agent_analytics table should exist');

      const columns = result.rows.map(r => r.column_name);
      assert.ok(columns.includes('id'), 'should have id column');
      assert.ok(columns.includes('session_id'), 'should have session_id column');
      assert.ok(columns.includes('event_type'), 'should have event_type column');
      assert.ok(columns.includes('event_data'), 'should have event_data column');
      assert.ok(columns.includes('created_at'), 'should have created_at column');
    });
  });

  describe('Index Creation', () => {
    it('should have indexes on sales_agent_sessions table', async () => {
      const result = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'sales_agent_sessions'
      `);

      const indexNames = result.rows.map(r => r.indexname);
      
      assert.ok(indexNames.includes('idx_sessions_session_id'), 
        'should have index on session_id');
      assert.ok(indexNames.includes('idx_sessions_status'), 
        'should have index on status');
      assert.ok(indexNames.includes('idx_sessions_created_at'), 
        'should have index on created_at');
      assert.ok(indexNames.includes('idx_sessions_last_activity'), 
        'should have index on last_activity_at');
    });

    it('should have indexes on sales_agent_messages table', async () => {
      const result = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'sales_agent_messages'
      `);

      const indexNames = result.rows.map(r => r.indexname);
      
      assert.ok(indexNames.includes('idx_messages_session_id'), 
        'should have index on session_id');
      assert.ok(indexNames.includes('idx_messages_created_at'), 
        'should have index on created_at');
    });

    it('should have indexes on sales_agent_leads table', async () => {
      const result = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'sales_agent_leads'
      `);

      const indexNames = result.rows.map(r => r.indexname);
      
      assert.ok(indexNames.includes('idx_leads_email'), 
        'should have index on email');
      assert.ok(indexNames.includes('idx_leads_status'), 
        'should have index on status');
      assert.ok(indexNames.includes('idx_leads_created_at'), 
        'should have index on created_at');
    });

    it('should have indexes on sales_agent_analytics table', async () => {
      const result = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'sales_agent_analytics'
      `);

      const indexNames = result.rows.map(r => r.indexname);
      
      assert.ok(indexNames.includes('idx_analytics_session_id'), 
        'should have index on session_id');
      assert.ok(indexNames.includes('idx_analytics_event_type'), 
        'should have index on event_type');
      assert.ok(indexNames.includes('idx_analytics_created_at'), 
        'should have index on created_at');
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should have foreign key from sales_agent_messages to sales_agent_sessions', async () => {
      const result = await pool.query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'sales_agent_messages'
          AND kcu.column_name = 'session_id'
      `);

      assert.strictEqual(result.rows.length, 1, 'should have one foreign key on session_id');
      assert.strictEqual(result.rows[0].foreign_table_name, 'sales_agent_sessions',
        'should reference sales_agent_sessions');
      assert.strictEqual(result.rows[0].foreign_column_name, 'id',
        'should reference id column');
      assert.strictEqual(result.rows[0].delete_rule, 'CASCADE',
        'should cascade on delete');
    });

    it('should have foreign key from sales_agent_leads to sales_agent_sessions', async () => {
      const result = await pool.query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'sales_agent_leads'
          AND kcu.column_name = 'session_id'
      `);

      assert.strictEqual(result.rows.length, 1, 'should have one foreign key on session_id');
      assert.strictEqual(result.rows[0].foreign_table_name, 'sales_agent_sessions',
        'should reference sales_agent_sessions');
      assert.strictEqual(result.rows[0].foreign_column_name, 'id',
        'should reference id column');
      assert.strictEqual(result.rows[0].delete_rule, 'CASCADE',
        'should cascade on delete');
    });

    it('should have foreign key from sales_agent_analytics to sales_agent_sessions', async () => {
      const result = await pool.query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'sales_agent_analytics'
          AND kcu.column_name = 'session_id'
      `);

      assert.strictEqual(result.rows.length, 1, 'should have one foreign key on session_id');
      assert.strictEqual(result.rows[0].foreign_table_name, 'sales_agent_sessions',
        'should reference sales_agent_sessions');
      assert.strictEqual(result.rows[0].foreign_column_name, 'id',
        'should reference id column');
      assert.strictEqual(result.rows[0].delete_rule, 'CASCADE',
        'should cascade on delete');
    });

    it('should have foreign key from sales_agent_sessions to sales_agent_leads', async () => {
      const result = await pool.query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'sales_agent_sessions'
          AND kcu.column_name = 'lead_id'
      `);

      assert.strictEqual(result.rows.length, 1, 'should have one foreign key on lead_id');
      assert.strictEqual(result.rows[0].foreign_table_name, 'sales_agent_leads',
        'should reference sales_agent_leads');
      assert.strictEqual(result.rows[0].foreign_column_name, 'id',
        'should reference id column');
      assert.strictEqual(result.rows[0].delete_rule, 'SET NULL',
        'should set null on delete');
    });
  });

  describe('Data Insertion and Retrieval', () => {
    it('should insert and retrieve a session', async () => {
      const sessionData = {
        session_id: 'test-session-' + Date.now(),
        visitor_id: 'visitor-123',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        status: 'active',
        message_count: 0,
      };

      const insertResult = await pool.query(`
        INSERT INTO sales_agent_sessions (session_id, visitor_id, ip_address, user_agent, status, message_count)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        sessionData.session_id,
        sessionData.visitor_id,
        sessionData.ip_address,
        sessionData.user_agent,
        sessionData.status,
        sessionData.message_count,
      ]);

      testSessionId = insertResult.rows[0].id;

      assert.ok(insertResult.rows[0].id, 'should return generated id');
      assert.strictEqual(insertResult.rows[0].session_id, sessionData.session_id);
      assert.strictEqual(insertResult.rows[0].status, 'active');
      assert.strictEqual(insertResult.rows[0].lead_captured, false, 'lead_captured should default to false');

      // Retrieve the session
      const selectResult = await pool.query(
        'SELECT * FROM sales_agent_sessions WHERE id = $1',
        [testSessionId]
      );

      assert.strictEqual(selectResult.rows.length, 1);
      assert.strictEqual(selectResult.rows[0].session_id, sessionData.session_id);
    });

    it('should insert and retrieve messages linked to session', async () => {
      // Ensure we have a session
      if (!testSessionId) {
        const sessionResult = await pool.query(`
          INSERT INTO sales_agent_sessions (session_id, status)
          VALUES ($1, $2)
          RETURNING id
        `, ['test-session-messages-' + Date.now(), 'active']);
        testSessionId = sessionResult.rows[0].id;
      }

      const messageData = {
        sender: 'user',
        message_text: 'Hello, I need information about your services',
      };

      const insertResult = await pool.query(`
        INSERT INTO sales_agent_messages (session_id, sender, message_text)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [testSessionId, messageData.sender, messageData.message_text]);

      assert.ok(insertResult.rows[0].id, 'should return generated id');
      assert.strictEqual(insertResult.rows[0].sender, messageData.sender);
      assert.strictEqual(insertResult.rows[0].message_text, messageData.message_text);

      // Retrieve messages for session
      const selectResult = await pool.query(
        'SELECT * FROM sales_agent_messages WHERE session_id = $1 ORDER BY created_at',
        [testSessionId]
      );

      assert.ok(selectResult.rows.length > 0);
      assert.strictEqual(selectResult.rows[0].message_text, messageData.message_text);
    });

    it('should insert and retrieve leads linked to session', async () => {
      // Ensure we have a session
      if (!testSessionId) {
        const sessionResult = await pool.query(`
          INSERT INTO sales_agent_sessions (session_id, status)
          VALUES ($1, $2)
          RETURNING id
        `, ['test-session-leads-' + Date.now(), 'active']);
        testSessionId = sessionResult.rows[0].id;
      }

      const leadData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91 98765 43210',
        service_interest: 'AI Voice Receptionist',
      };

      const insertResult = await pool.query(`
        INSERT INTO sales_agent_leads (session_id, name, email, phone, service_interest)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [testSessionId, leadData.name, leadData.email, leadData.phone, leadData.service_interest]);

      testLeadId = insertResult.rows[0].id;

      assert.ok(insertResult.rows[0].id, 'should return generated id');
      assert.strictEqual(insertResult.rows[0].name, leadData.name);
      assert.strictEqual(insertResult.rows[0].email, leadData.email);
      assert.strictEqual(insertResult.rows[0].status, 'new', 'status should default to new');
      assert.strictEqual(insertResult.rows[0].source, 'sales_agent', 'source should default to sales_agent');

      // Retrieve the lead
      const selectResult = await pool.query(
        'SELECT * FROM sales_agent_leads WHERE id = $1',
        [testLeadId]
      );

      assert.strictEqual(selectResult.rows.length, 1);
      assert.strictEqual(selectResult.rows[0].email, leadData.email);
    });

    it('should insert and retrieve analytics events', async () => {
      // Ensure we have a session
      if (!testSessionId) {
        const sessionResult = await pool.query(`
          INSERT INTO sales_agent_sessions (session_id, status)
          VALUES ($1, $2)
          RETURNING id
        `, ['test-session-analytics-' + Date.now(), 'active']);
        testSessionId = sessionResult.rows[0].id;
      }

      const eventData = {
        event_type: 'session_start',
        event_data: { source: 'homepage', device: 'desktop' },
      };

      const insertResult = await pool.query(`
        INSERT INTO sales_agent_analytics (session_id, event_type, event_data)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [testSessionId, eventData.event_type, JSON.stringify(eventData.event_data)]);

      assert.ok(insertResult.rows[0].id, 'should return generated id');
      assert.strictEqual(insertResult.rows[0].event_type, eventData.event_type);
      assert.deepStrictEqual(insertResult.rows[0].event_data, eventData.event_data);

      // Retrieve events for session
      const selectResult = await pool.query(
        'SELECT * FROM sales_agent_analytics WHERE session_id = $1',
        [testSessionId]
      );

      assert.ok(selectResult.rows.length > 0);
      assert.strictEqual(selectResult.rows[0].event_type, eventData.event_type);
    });

    it('should enforce unique constraint on session_id', async () => {
      const sessionId = 'unique-test-' + Date.now();

      await pool.query(`
        INSERT INTO sales_agent_sessions (session_id, status)
        VALUES ($1, $2)
      `, [sessionId, 'active']);

      // Try to insert duplicate session_id
      await assert.rejects(
        async () => {
          await pool.query(`
            INSERT INTO sales_agent_sessions (session_id, status)
            VALUES ($1, $2)
          `, [sessionId, 'active']);
        },
        (err) => {
          assert.ok(err.message.includes('duplicate key') || err.code === '23505',
            'should reject duplicate session_id');
          return true;
        }
      );

      // Cleanup
      await pool.query('DELETE FROM sales_agent_sessions WHERE session_id = $1', [sessionId]);
    });

    it('should cascade delete messages when session is deleted', async () => {
      // Create a session
      const sessionResult = await pool.query(`
        INSERT INTO sales_agent_sessions (session_id, status)
        VALUES ($1, $2)
        RETURNING id
      `, ['cascade-test-' + Date.now(), 'active']);
      const sessionId = sessionResult.rows[0].id;

      // Insert messages
      await pool.query(`
        INSERT INTO sales_agent_messages (session_id, sender, message_text)
        VALUES ($1, $2, $3)
      `, [sessionId, 'user', 'Test message']);

      // Verify message exists
      const beforeDelete = await pool.query(
        'SELECT * FROM sales_agent_messages WHERE session_id = $1',
        [sessionId]
      );
      assert.strictEqual(beforeDelete.rows.length, 1);

      // Delete session
      await pool.query('DELETE FROM sales_agent_sessions WHERE id = $1', [sessionId]);

      // Verify messages are cascade deleted
      const afterDelete = await pool.query(
        'SELECT * FROM sales_agent_messages WHERE session_id = $1',
        [sessionId]
      );
      assert.strictEqual(afterDelete.rows.length, 0, 'messages should be cascade deleted');
    });

    it('should set null on lead_id when lead is deleted', async () => {
      // Create a session
      const sessionResult = await pool.query(`
        INSERT INTO sales_agent_sessions (session_id, status)
        VALUES ($1, $2)
        RETURNING id
      `, ['set-null-test-' + Date.now(), 'active']);
      const sessionId = sessionResult.rows[0].id;

      // Create a lead
      const leadResult = await pool.query(`
        INSERT INTO sales_agent_leads (session_id, name, email, service_interest)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [sessionId, 'Test User', 'test@example.com', 'Test Service']);
      const leadId = leadResult.rows[0].id;

      // Update session with lead_id
      await pool.query(
        'UPDATE sales_agent_sessions SET lead_id = $1 WHERE id = $2',
        [leadId, sessionId]
      );

      // Verify lead_id is set
      const beforeDelete = await pool.query(
        'SELECT lead_id FROM sales_agent_sessions WHERE id = $1',
        [sessionId]
      );
      assert.strictEqual(beforeDelete.rows[0].lead_id, leadId);

      // Delete lead
      await pool.query('DELETE FROM sales_agent_leads WHERE id = $1', [leadId]);

      // Verify lead_id is set to null
      const afterDelete = await pool.query(
        'SELECT lead_id FROM sales_agent_sessions WHERE id = $1',
        [sessionId]
      );
      assert.strictEqual(afterDelete.rows[0].lead_id, null, 'lead_id should be set to null');

      // Cleanup
      await pool.query('DELETE FROM sales_agent_sessions WHERE id = $1', [sessionId]);
    });

    it('should handle JSONB data in metadata and event_data', async () => {
      // Ensure we have a session
      if (!testSessionId) {
        const sessionResult = await pool.query(`
          INSERT INTO sales_agent_sessions (session_id, status)
          VALUES ($1, $2)
          RETURNING id
        `, ['test-jsonb-' + Date.now(), 'active']);
        testSessionId = sessionResult.rows[0].id;
      }

      const metadata = {
        intent: 'inquiry',
        confidence: 0.95,
        entities: ['service', 'pricing'],
      };

      // Insert message with JSONB metadata
      const messageResult = await pool.query(`
        INSERT INTO sales_agent_messages (session_id, sender, message_text, metadata)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [testSessionId, 'user', 'Tell me about pricing', JSON.stringify(metadata)]);

      assert.deepStrictEqual(messageResult.rows[0].metadata, metadata,
        'should store and retrieve JSONB data correctly');
    });

    it('should handle array data in services_discussed', async () => {
      const services = ['AI Voice Receptionist', 'WhatsApp Automation'];

      const sessionResult = await pool.query(`
        INSERT INTO sales_agent_sessions (session_id, status, services_discussed)
        VALUES ($1, $2, $3)
        RETURNING *
      `, ['test-array-' + Date.now(), 'active', services]);

      assert.deepStrictEqual(sessionResult.rows[0].services_discussed, services,
        'should store and retrieve array data correctly');

      // Cleanup
      await pool.query('DELETE FROM sales_agent_sessions WHERE id = $1',
        [sessionResult.rows[0].id]);
    });
  });
});
