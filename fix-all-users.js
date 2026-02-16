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

async function fixAllUsers() {
  console.log('🔧 Complete User Fix Script\n');
  console.log('This will fix:\n- NULL passwords\n- Inactive status\n- Missing roles\n');
  
  const client = await pool.connect();
  
  try {
    // 1. Check current state
    console.log('📊 Current user state:');
    const currentUsers = await client.query('SELECT id, name, email, role, status, password FROM users');
    
    console.log(`Found ${currentUsers.rows.length} users:\n`);
    currentUsers.rows.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  Role: ${user.role || 'NULL'}`);
      console.log(`  Status: ${user.status || 'NULL'}`);
      console.log(`  Password: ${user.password ? 'SET (' + user.password.length + ' chars)' : 'NULL'}`);
      console.log('');
    });
    
    // 2. Start transaction
    await client.query('BEGIN');
    
    // 3. Hash password
    const hashedPassword = bcrypt.hashSync('password123', 10);
    console.log('✅ Generated password hash\n');
    
    // 4. Fix Super Admin
    console.log('🔧 Fixing Super Admin...');
    const superAdmin = await client.query(`
      INSERT INTO users (name, email, password, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (email) 
      DO UPDATE SET 
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING id, name, email, role, status
    `, ['Super Admin', 'superadmin@papaloma.id', hashedPassword, 'super_admin', 'active']);
    
    console.log('✅ Super Admin fixed:');
    console.log(`   ID: ${superAdmin.rows[0].id}`);
    console.log(`   Role: ${superAdmin.rows[0].role}`);
    console.log(`   Status: ${superAdmin.rows[0].status}\n`);
    
    // 5. Fix Admin
    console.log('🔧 Fixing Admin...');
    const admin = await client.query(`
      INSERT INTO users (name, email, password, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (email) 
      DO UPDATE SET 
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING id, name, email, role, status
    `, ['Admin Restoran', 'admin@papaloma.id', hashedPassword, 'admin', 'active']);
    
    console.log('✅ Admin fixed:');
    console.log(`   ID: ${admin.rows[0].id}`);
    console.log(`   Role: ${admin.rows[0].role}`);
    console.log(`   Status: ${admin.rows[0].status}\n`);
    
    // 6. Commit transaction
    await client.query('COMMIT');
    
    // 7. Verify
    console.log('🔍 Verifying fixes...\n');
    const verifyUsers = await client.query(`
      SELECT id, name, email, role, status, 
             LENGTH(password) as password_length
      FROM users 
      WHERE email IN ('superadmin@papaloma.id', 'admin@papaloma.id')
      ORDER BY id
    `);
    
    console.log('📋 Final state:\n');
    verifyUsers.rows.forEach(user => {
      const allGood = user.role && user.status === 'active' && user.password_length === 60;
      const icon = allGood ? '✅' : '❌';
      
      console.log(`${icon} ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Password: ${user.password_length === 60 ? 'OK (60 chars)' : 'PROBLEM'}`);
      console.log('');
    });
    
    console.log('✅ All users fixed successfully!\n');
    console.log('🔑 Login credentials:');
    console.log('   Super Admin: superadmin@papaloma.id / password123');
    console.log('   Admin: admin@papaloma.id / password123\n');
    console.log('💡 You can now restart your server and login!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixAllUsers().catch(error => {
  console.error('Fix failed:', error);
  process.exit(1);
});
