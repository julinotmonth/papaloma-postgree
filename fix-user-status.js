import pool from './src/database/db.js';

async function fixUserStatus() {
  console.log('🔧 Fixing user status...');
  
  try {
    // Update all users to active status
    const result = await pool.query(`
      UPDATE users 
      SET status = 'active' 
      WHERE status != 'active' OR status IS NULL
      RETURNING id, name, email, status
    `);
    
    if (result.rowCount > 0) {
      console.log(`✅ Updated ${result.rowCount} user(s) to active status:`);
      result.rows.forEach(user => {
        console.log(`   - ${user.name} (${user.email}): ${user.status}`);
      });
    } else {
      console.log('✅ All users are already active!');
    }
    
    // Show all users
    const allUsers = await pool.query(`
      SELECT id, name, email, role, status, last_login 
      FROM users 
      ORDER BY id
    `);
    
    console.log('\n📋 All users in database:');
    allUsers.rows.forEach(user => {
      console.log(`   ${user.id}. ${user.name} (${user.email})`);
      console.log(`      Role: ${user.role}, Status: ${user.status}`);
      console.log(`      Last Login: ${user.last_login || 'Never'}`);
    });
    
    await pool.end();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

fixUserStatus();