import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertInboundEmailSecuritySchema,
  repairInboundEmailSecurity,
} from './secureInboundEmailMigration.js';

function createMigrationDatabase({ failOn } = {}) {
  const calls = [];
  let released = false;
  let deleteBatch = 0;

  const client = {
    async query(text, params = []) {
      const sql = String(text);
      calls.push({ sql, params });
      if (failOn && sql.includes(failOn)) throw new Error('simulated migration failure');

      if (sql.includes('FROM inbound_email_duplicate_map') && sql.includes('COUNT(1)')) {
        return { rows: [{ count: 3 }], rowCount: 1 };
      }
      if (sql.includes('UPDATE email_agent_reply_logs')) {
        return { rows: [], rowCount: 2 };
      }
      if (sql.includes('DELETE FROM inbound_email_duplicate_map')) {
        deleteBatch += 1;
        return { rows: [], rowCount: deleteBatch === 1 ? 3 : 0 };
      }
      if (sql.includes("SET status = 'quarantined'")) {
        return { rows: [], rowCount: 4 };
      }
      if (sql.includes('AS duplicate_groups')) {
        return { rows: [{ count: 0 }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    },
    release() {
      released = true;
    },
  };

  return {
    database: { connect: async () => client },
    calls,
    wasReleased: () => released,
  };
}

describe('repairInboundEmailSecurity', () => {
  it('repairs duplicate rows and commits every invariant atomically', async () => {
    const fake = createMigrationDatabase();
    const logger = { info() {} };

    const result = await repairInboundEmailSecurity(fake.database, {
      ownAddress: 'info@seevora.in',
      logger,
    });
    const statements = fake.calls.map((call) => call.sql);
    const allSql = statements.join('\n');

    assert.equal(statements[0], 'BEGIN');
    assert.match(allSql, /pg_advisory_xact_lock/);
    assert.match(allSql, /LOCK TABLE inbound_emails/);
    assert.match(allSql, /idx_reply_logs_inbound_email_id/);
    assert.match(allSql, /FIRST_VALUE\(id\) OVER canonical_order/);
    assert.match(allSql, /UPDATE email_agent_reply_logs/);
    assert.match(allSql, /DELETE FROM inbound_emails/);
    assert.match(allSql, /CREATE UNIQUE INDEX IF NOT EXISTS/);
    assert.match(allSql, /SET status = 'quarantined'/);
    assert.match(allSql, /UPDATE email_threads/);
    assert.match(allSql, /ANALYZE inbound_emails/);
    assert.equal(statements.at(-1), 'COMMIT');
    assert.equal(allSql.includes('SET message_id = NULL'), false);
    assert.deepEqual(result, {
      duplicatesFound: 3,
      duplicatesDeleted: 3,
      replyLogsRelinked: 2,
      messagesQuarantined: 4,
      durationMs: result.durationMs,
    });
    assert.equal(fake.wasReleased(), true);

    const backfillCall = fake.calls.find((call) => call.sql.includes("SET status = 'quarantined'"));
    assert.deepEqual(backfillCall.params, ['info@seevora.in']);
  });

  it('rolls back and releases the connection when repair fails', async () => {
    const fake = createMigrationDatabase({ failOn: 'CREATE TEMP TABLE' });
    const logger = { info() {} };

    await assert.rejects(
      repairInboundEmailSecurity(fake.database, { logger }),
      /simulated migration failure/
    );

    assert.equal(fake.calls.some((call) => call.sql === 'ROLLBACK'), true);
    assert.equal(fake.calls.some((call) => call.sql === 'COMMIT'), false);
    assert.equal(fake.wasReleased(), true);
  });
});

describe('assertInboundEmailSecuritySchema', () => {
  it('accepts a database with the quarantine column and unique index', async () => {
    const database = {
      query: async () => ({
        rows: [{ has_quarantine_reason: true, has_unique_index: true }],
      }),
    };

    assert.equal(await assertInboundEmailSecuritySchema(database), true);
  });

  it('fails closed when the unique index is missing', async () => {
    const database = {
      query: async () => ({
        rows: [{ has_quarantine_reason: true, has_unique_index: false }],
      }),
    };

    await assert.rejects(
      assertInboundEmailSecuritySchema(database),
      /IMAP polling remains disabled/
    );
  });
});
