import pool, { query } from './db.js';

async function migrate() {
  console.log('🚀 Starting database migration...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Drop existing tables if exist (be careful in production!)
    console.log('🗑️  Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS activity_logs CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS transaksi_keluar CASCADE;
      DROP TABLE IF EXISTS transaksi_masuk CASCADE;
      DROP TABLE IF EXISTS barang CASCADE;
      DROP TABLE IF EXISTS kategori CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    
    // Create users table
    console.log('👤 Creating users table...');
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) CHECK(role IN ('super_admin', 'admin')) NOT NULL DEFAULT 'admin',
        status VARCHAR(20) CHECK(status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
        avatar TEXT,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create kategori table
    console.log('📁 Creating kategori table...');
    await client.query(`
      CREATE TABLE kategori (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create barang table
    console.log('📦 Creating barang table...');
    await client.query(`
      CREATE TABLE barang (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        kategori_id INTEGER NOT NULL REFERENCES kategori(id) ON DELETE RESTRICT,
        satuan VARCHAR(50) NOT NULL,
        stok INTEGER NOT NULL DEFAULT 0,
        stok_minimum INTEGER NOT NULL DEFAULT 0,
        harga_per_unit DECIMAL(15, 2) NOT NULL DEFAULT 0,
        lokasi VARCHAR(255) NOT NULL,
        kondisi VARCHAR(20) CHECK(kondisi IN ('baik', 'rusak', 'kadaluarsa')) NOT NULL DEFAULT 'baik',
        tanggal_kadaluarsa DATE,
        catatan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create transaksi_masuk table
    console.log('📥 Creating transaksi_masuk table...');
    await client.query(`
      CREATE TABLE transaksi_masuk (
        id SERIAL PRIMARY KEY,
        barang_id INTEGER NOT NULL REFERENCES barang(id) ON DELETE RESTRICT,
        jumlah INTEGER NOT NULL,
        tanggal DATE NOT NULL,
        supplier VARCHAR(255) NOT NULL,
        catatan TEXT,
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create transaksi_keluar table
    console.log('📤 Creating transaksi_keluar table...');
    await client.query(`
      CREATE TABLE transaksi_keluar (
        id SERIAL PRIMARY KEY,
        barang_id INTEGER NOT NULL REFERENCES barang(id) ON DELETE RESTRICT,
        jumlah INTEGER NOT NULL,
        tanggal DATE NOT NULL,
        alasan VARCHAR(255) NOT NULL,
        catatan TEXT,
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create notifications table
    console.log('🔔 Creating notifications table...');
    await client.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) CHECK(type IN ('warning', 'info', 'success', 'danger')) NOT NULL DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create activity_logs table
    console.log('📝 Creating activity_logs table...');
    await client.query(`
      CREATE TABLE activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100),
        entity_id INTEGER,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    console.log('🔍 Creating indexes...');
    await client.query(`
      CREATE INDEX idx_barang_kategori ON barang(kategori_id);
      CREATE INDEX idx_barang_kondisi ON barang(kondisi);
      CREATE INDEX idx_transaksi_masuk_barang ON transaksi_masuk(barang_id);
      CREATE INDEX idx_transaksi_masuk_tanggal ON transaksi_masuk(tanggal);
      CREATE INDEX idx_transaksi_keluar_barang ON transaksi_keluar(barang_id);
      CREATE INDEX idx_transaksi_keluar_tanggal ON transaksi_keluar(tanggal);
      CREATE INDEX idx_notifications_user ON notifications(user_id);
      CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
    `);
    
    // Create trigger for updated_at
    console.log('⚡ Creating triggers...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await client.query(`
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_kategori_updated_at BEFORE UPDATE ON kategori
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_barang_updated_at BEFORE UPDATE ON barang
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    await client.query('COMMIT');
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});
