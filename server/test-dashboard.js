import 'dotenv/config';
import pool from './config/db.js';

async function test() {
  try {
    console.log('Testing empRes...');
    await pool.query('SELECT COUNT(*) as count FROM hr_employees WHERE status = $1', ['active']);

    console.log('Testing leadsCountRes...');
    await pool.query('SELECT COUNT(*) as count FROM leads');

    console.log('Testing recentLeadsRes...');
    await pool.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 5');

    console.log('Testing projectsRes...');
    await pool.query('SELECT COUNT(*) as count FROM projects WHERE status = $1', ['active']);

    console.log('Testing tasksRes...');
    await pool.query('SELECT status, COUNT(*) as count FROM tasks GROUP BY status');

    console.log('Testing apptCountRes...');
    await pool.query('SELECT COUNT(*) as count FROM appointments');

    console.log('Testing upcomingApptRes...');
    await pool.query(`
      SELECT * FROM appointments 
      WHERE scheduled_at >= CURRENT_DATE 
      ORDER BY scheduled_at ASC 
      LIMIT 5
    `);

    console.log('Testing attendanceRes...');
    await pool.query(`
      SELECT COUNT(*) as count FROM attendance_records 
      WHERE work_date = CURRENT_DATE AND status = 'present'
    `);

    console.log('Testing auditRes...');
    await pool.query(`
      SELECT a.*, u.username as user_name 
      FROM system_audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC 
      LIMIT 5
    `);

    console.log('All queries passed!');
  } catch (err) {
    console.error('Error in query:', err);
  } finally {
    await pool.end();
  }
}

test();
