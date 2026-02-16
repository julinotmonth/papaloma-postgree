import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Railway provides DATABASE_URL or individual environment variables
const getDatabaseConfig = () => {
  // Check if DATABASE_URL exists (Railway's preferred method)
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false
    };
  }
  
  // Fallback to individual environment variables
  return {
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
    database: process.env.DB_NAME || process.env.PGDATABASE || 'papaloma_db',
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
};

// Create PostgreSQL connection pool
const pool = new Pool(getDatabaseConfig());

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper to get a client from pool for transactions
export const getClient = async () => {
  return await pool.connect();
};

// Initialize database (check connection)
export const initializeDatabase = async () => {
  try {
    await query('SELECT NOW()');
    console.log('✅ Database initialized successfully');
    
    // Log connection info (without sensitive data)
    if (process.env.DATABASE_URL) {
      console.log('📊 Using DATABASE_URL connection');
    } else {
      console.log(`📊 Connected to ${process.env.DB_HOST || process.env.PGHOST}:${process.env.DB_PORT || process.env.PGPORT}`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
};

export default pool;