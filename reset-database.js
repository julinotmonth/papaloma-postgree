import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection
const pool = new Pool(
  process.env.DATABASE_URL 
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host: process.env.DB_HOST || process.env.PGHOST,
        port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
        database: process.env.DB_NAME || process.env.PGDATABASE,
        user: process.env.DB_USER || process.env.PGUSER,
        password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false
        } : false
      }
);

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...\n');

    // Step 1: Delete all users
    console.log('1️⃣  Deleting existing users...');
    const deleteResult = await pool.query('DELETE FROM users');
    console.log(`   ✅ Deleted ${deleteResult.rowCount} users\n`);

    // Step 2: Generate password hashes
    console.log('2️⃣  Generating password hashes...');
    const superAdminPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('password123', 10);
    const staffPassword = await bcrypt.hash('password123', 10);
    console.log('   ✅ Password hashes generated\n');

    // Step 3: Insert new users
    console.log('3️⃣  Creating new users...');
    
    // Super Admin
    await pool.query(`
      INSERT INTO users (name, email, password, role, status)
      VALUES ($1, $2, $3, $4, $5)
    `, ['Super Admin', 'superadmin@papaloma.id', superAdminPassword, 'superadmin', 'active']);
    console.log('   ✅ Super Admin created');

    // Admin
    await pool.query(`
      INSERT INTO users (name, email, password, role, status)
      VALUES ($1, $2, $3, $4, $5)
    `, ['Admin User', 'admin@papaloma.id', adminPassword, 'admin', 'active']);
    console.log('   ✅ Admin created');

    // Staff
    await pool.query(`
      INSERT INTO users (name, email, password, role, status)
      VALUES ($1, $2, $3, $4, $5)
    `, ['Staff User', 'staff@papaloma.id', staffPassword, 'staff', 'active']);
    console.log('   ✅ Staff created\n');

    // Step 4: Verify users
    console.log('4️⃣  Verifying users...');
    const users = await pool.query(`
      SELECT id, name, email, role, status, 
             LENGTH(password) as password_length,
             LEFT(password, 7) as password_start
      FROM users 
      ORDER BY id
    `);
    
    console.log('\n📊 Users in database:\n');
    users.rows.forEach(user => {
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Password hash: ${user.password_start}... (${user.password_length} chars)`);
      console.log('');
    });

    console.log('✅ Database reset completed!\n');
    console.log('🔐 Default credentials:');
    console.log('   Super Admin: superadmin@papaloma.id / password123');
    console.log('   Admin:       admin@papaloma.id / password123');
    console.log('   Staff:       staff@papaloma.id / password123\n');

  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

// Run the reset
resetDatabase();