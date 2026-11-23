import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL environment variable is not defined.');
}

declare global {
  // eslint-disable-next-line no-var
  var __db_pool: Pool | undefined;
}

// Optimized connection pool keeping warm connections ready
export const pool =
  global.__db_pool ||
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 20,
    min: 2, // Keep 2 warm connections permanently open to eliminate 500ms+ cold connect latency!
    idleTimeoutMillis: 120000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: false,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__db_pool = pool;
}

// Warm up the pool immediately on startup
pool.query('SELECT 1').catch((err) => {
  console.warn('Initial DB warm-up warning:', err.message);
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    return res.rows as T[];
  } catch (err: any) {
    console.error(`DB Query error (${Date.now() - start}ms):`, text.substring(0, 100), err.message);
    throw err;
  }
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}
