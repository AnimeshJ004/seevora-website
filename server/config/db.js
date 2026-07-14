import pg from 'pg';

const { Pool } = pg;

const config = {
  ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.DATABASE_URL?.includes('supabase.com') ? { rejectUnauthorized: false } : (process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined),
  // Performance tuning: keep connections warm to avoid cold-start overhead with remote DB
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 15000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

if (process.env.DATABASE_URL) {
  config.connectionString = process.env.DATABASE_URL;
} else {
  config.host = process.env.PGHOST;
  if (process.env.PGPORT) config.port = Number(process.env.PGPORT);
  config.database = process.env.PGDATABASE;
  config.user = process.env.PGUSER;
  config.password = process.env.PGPASSWORD;
}

const pool = new Pool(config);

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle database client', err);
});

export default pool;
