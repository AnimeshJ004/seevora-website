import 'dotenv/config';
import pool from '../server/config/db.js';

async function reset() {
  // Clear all login rate limit buckets
  const res = await pool.query(`DELETE FROM rate_limit_buckets WHERE policy = 'auth_login'`);
  console.log(`Cleared ${res.rowCount} rate limit bucket(s) for auth_login.`);
  process.exit(0);
}

reset().catch(err => { console.error(err.message); process.exit(1); });
