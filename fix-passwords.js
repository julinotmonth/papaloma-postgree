import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'papaloma_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function fixUserPasswords() {
  console.log('🔧 Fixing user passwords...\n');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Hash password
    const hashedPassword = bcrypt.hashSync('password123', 10);
    console.log('Generated password hash:', hashedPassword.substring(0, 20) + '...');
    console.log('Hash length:', hashedPassword.length);
    
    // Update all users (password AND status)
    const result = await client.query(`
      UPDATE users 
      SET password = $1, status = 'active'
      WHERE email IN ('superadmin@papaloma.id', 'admin@papaloma.id')
      RETURNING id, name, email, role, status
    `, [hashedPassword]);
    
    console.log(`\n✅ Updated ${result.rows.length} users:\n`);
    result.rows.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Status: ${user.status}`);
    });
    
    await client.query('COMMIT');
    
    console.log('\n✅ Password fix completed!');
    console.log('You can now login with:');
    console.log('  Email: admin@papaloma.id');
    console.log('  Password: password123');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixUserPasswords();
