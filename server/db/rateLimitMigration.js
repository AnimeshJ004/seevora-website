import pool from '../config/db.js';

export async function ensureRateLimitSchema(database = pool) {
  await database.query(`
    CREATE TABLE IF NOT EXISTS rate_limit_buckets (
      policy VARCHAR(80) NOT NULL,
      subject_hash CHAR(64) NOT NULL,
      hit_count INTEGER NOT NULL DEFAULT 0 CHECK (hit_count >= 0),
      window_started_at TIMESTAMPTZ NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (policy, subject_hash)
    )
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS rate_limit_buckets_expiry_idx
    ON rate_limit_buckets (expires_at)
  `);
}

export async function cleanupExpiredRateLimits(database = pool) {
  const result = await database.query(`
    DELETE FROM rate_limit_buckets
    WHERE expires_at < NOW() - INTERVAL '1 day'
  `);
  return result.rowCount || 0;
}
