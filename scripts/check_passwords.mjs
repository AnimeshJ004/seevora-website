import 'dotenv/config';
import pool from '../server/config/db.js';
import bcrypt from 'bcryptjs';

async function check() {
  const res = await pool.query('SELECT email, password_hash FROM users WHERE role = $1', ['employee']);
  for (const u of res.rows) {
    const match = await bcrypt.compare('employee123', u.password_hash);
    console.log(u.email, '→ match:', match);
  }
  process.exit(0);
}

check().catch(err => { console.error(err); process.exit(1); });
