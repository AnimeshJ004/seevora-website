import 'dotenv/config';
import pool from '../server/config/db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  const adminHash = await bcrypt.hash('admin123', 12);
  const hrHash = await bcrypt.hash('hr123', 12);
  const managerHash = await bcrypt.hash('manager123', 12);
  const empHash = await bcrypt.hash('employee123', 12);

  await pool.query('UPDATE users SET password_hash = $1 WHERE email = ANY($2::text[])', [adminHash, ['admin@seevora.in', 'ceo@seevora.in']]);
  await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hrHash, 'hr@seevora.in']);
  await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [managerHash, 'manager@seevora.in']);
  await pool.query('UPDATE users SET password_hash = $1 WHERE role = $2', [empHash, 'employee']);

  console.log('Successfully updated demo credentials for all roles!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
