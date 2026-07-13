import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.DATABASE_URL?.includes('supabase.com') ? { rejectUnauthorized: false } : (process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined),
  // Performance tuning: keep connections warm to avoid cold-start overhead with remote DB
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 15000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle database client', err);
});

export default pool;
