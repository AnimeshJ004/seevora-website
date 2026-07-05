import 'dotenv/config';
import pool from './server/config/db.js';

async function cleanup() {
  try {
    const res = await pool.query('DELETE FROM audit_requests WHERE email = $1', ['john@example.com']);
    console.log(`Deleted ${res.rowCount} example audit request(s).`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

cleanup();
