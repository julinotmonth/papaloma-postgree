import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'papaloma_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function debugUsers() {
  console.log('🔍 Checking users in database...\n');
  
  try {
    const result = await pool.query('SELECT id, name, email, role, status, password FROM users');
    
    console.log(`Found ${result.rows.length} users:\n`);
    
    result.rows.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Status: ${user.status}`);
      console.log(`Password hash: ${user.password ? user.password.substring(0, 20) + '...' : 'NULL/UNDEFINED'}`);
      console.log(`Password length: ${user.password ? user.password.length : 0}`);
      console.log('---\n');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

debugUsers();
