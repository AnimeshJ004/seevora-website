import 'dotenv/config';
import pool from '../server/config/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

async function createDemoUsers() {
  const password = await bcrypt.hash('demo123', 12);

  const users = [
    { username: 'sales_dev_demo', email: 'salesdev@seevora.in', phone: '+91 90000 00010', role: 'sales_developer' },
    { username: 'developer_demo', email: 'developer@seevora.in', phone: '+91 90000 00011', role: 'developer' },
    { username: 'sales_demo',     email: 'sales@seevora.in',     phone: '+91 90000 00012', role: 'sales' },
    { username: 'telecaller_demo',email: 'telecaller@seevora.in',phone: '+91 90000 00013', role: 'telecaller' },
    { username: 'support_demo',   email: 'support@seevora.in',   phone: '+91 90000 00014', role: 'support' },
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO users (id, username, email, phone, password_hash, role, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'VERIFIED')
       ON CONFLICT (email) DO UPDATE SET password_hash = $5, role = $6, verification_status = 'VERIFIED'`,
      [crypto.randomUUID(), u.username, u.email, u.phone, password, u.role]
    );
    console.log(`✓ ${u.role}: ${u.email}`);
  }

  console.log('\nAll demo users created! Password for all: demo123');
  process.exit(0);
}

createDemoUsers().catch(err => { console.error(err.message); process.exit(1); });
