import 'dotenv/config';
import pool from '../server/config/db.js';

async function check() {
  // Check rate limit entries
  const res = await pool.query(`
    SELECT policy, subject, hit_count, window_start, blocked_until
    FROM rate_limits
    ORDER BY window_start DESC
    LIMIT 20
  `);
  console.log('Rate limits:', res.rows);
  process.exit(0);
}

check().catch(err => { console.error(err.message); process.exit(1); });
