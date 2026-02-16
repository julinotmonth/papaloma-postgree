import bcrypt from 'bcryptjs';
import pool from './db.js';

async function seed() {
  console.log('🌱 Seeding database...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Seed Users
    console.log('👤 Seeding users...');
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    await client.query(`
      INSERT INTO users (name, email, password, role, status, last_login, created_at, updated_at) 
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8),
        ($9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      'Super Admin', 'superadmin@papaloma.id', hashedPassword, 'super_admin', 'active', 
      new Date(), '2024-01-01T00:00:00.000Z', new Date(),
      'Admin Restoran', 'admin@papaloma.id', hashedPassword, 'admin', 'active', 
      new Date(), '2024-02-15T00:00:00.000Z', new Date()
    ]);
    
    // Seed Kategori
    console.log('📁 Seeding kategori...');
    const kategoris = [
      ['Daging & Unggas', 'Daging sapi, ayam, ikan'],
      ['Sayuran', 'Sayuran segar'],
      ['Bumbu Dapur', 'Bumbu dan rempah'],
      ['Dairy & Telur', 'Susu, keju, telur'],
      ['Kering & Tepung', 'Beras, tepung, mie'],
      ['Minuman', 'Minuman dan sirup'],
      ['Minyak & Saus', 'Minyak goreng, kecap, saus'],
    ];
    
    for (const [name, description] of kategoris) {
      await client.query(
        'INSERT INTO kategori (name, description) VALUES ($1, $2)',
        [name, description]
      );
    }
    
    // Seed Barang
    console.log('📦 Seeding barang...');
    const barangs = [
      ['Daging Sapi Wagyu', 1, 'kg', 25, 10, 350000, 'Freezer A1', 'baik', '2025-01-15', 'Premium quality'],
      ['Ayam Fillet', 1, 'kg', 40, 20, 55000, 'Freezer A2', 'baik', '2024-12-20', null],
      ['Bawang Merah', 3, 'kg', 2, 5, 35000, 'Rak Bumbu B1', 'baik', null, null],
      ['Bawang Putih', 3, 'kg', 8, 5, 40000, 'Rak Bumbu B1', 'baik', null, null],
      ['Susu Segar', 4, 'liter', 15, 10, 18000, 'Chiller C1', 'baik', '2024-12-10', null],
      ['Telur Ayam', 4, 'butir', 200, 100, 2500, 'Chiller C2', 'baik', null, null],
      ['Beras Premium', 5, 'kg', 100, 50, 15000, 'Gudang D1', 'baik', null, null],
      ['Tepung Terigu', 5, 'kg', 30, 20, 12000, 'Gudang D2', 'baik', null, null],
      ['Cabai Merah', 2, 'kg', 3, 5, 80000, 'Chiller C3', 'baik', null, null],
      ['Wortel', 2, 'kg', 12, 8, 18000, 'Chiller C3', 'baik', null, null],
      ['Minyak Goreng', 7, 'liter', 50, 25, 22000, 'Gudang D3', 'baik', null, null],
      ['Kecap Manis', 7, 'botol', 20, 10, 25000, 'Rak Bumbu B2', 'baik', null, null],
    ];
    
    for (const barang of barangs) {
      await client.query(`
        INSERT INTO barang (
          name, kategori_id, satuan, stok, stok_minimum, harga_per_unit,
          lokasi, kondisi, tanggal_kadaluarsa, catatan
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, barang);
    }
    
    // Seed Transaksi Masuk
    console.log('📥 Seeding transaksi masuk...');
    await client.query(`
      INSERT INTO transaksi_masuk (barang_id, jumlah, tanggal, supplier, catatan, created_by, created_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7),
        ($8, $9, $10, $11, $12, $13, $14),
        ($15, $16, $17, $18, $19, $20, $21)
    `, [
      1, 10, '2024-12-01', 'PT Wagyu Indonesia', 'Pengiriman rutin', 1, '2024-12-01T08:00:00.000Z',
      2, 20, '2024-12-02', 'CV Ayam Segar', null, 2, '2024-12-02T09:00:00.000Z',
      7, 50, '2024-12-03', 'Toko Beras Makmur', null, 1, '2024-12-03T10:00:00.000Z'
    ]);
    
    // Seed Transaksi Keluar
    console.log('📤 Seeding transaksi keluar...');
    await client.query(`
      INSERT INTO transaksi_keluar (barang_id, jumlah, tanggal, alasan, catatan, created_by, created_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7),
        ($8, $9, $10, $11, $12, $13, $14)
    `, [
      1, 5, '2024-12-01', 'Pemakaian harian', null, 2, '2024-12-01T12:00:00.000Z',
      6, 50, '2024-12-02', 'Pemakaian harian', null, 2, '2024-12-02T12:00:00.000Z'
    ]);
    
    // Seed Notifications
    console.log('🔔 Seeding notifications...');
    await client.query(`
      INSERT INTO notifications (user_id, type, title, message, read, created_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6),
        ($7, $8, $9, $10, $11, $12),
        ($13, $14, $15, $16, $17, $18)
    `, [
      null, 'warning', 'Stok Menipis', 'Bawang Merah tersisa 2 kg (minimum: 5 kg)', false, new Date(),
      null, 'warning', 'Stok Menipis', 'Cabai Merah tersisa 3 kg (minimum: 5 kg)', false, new Date(),
      null, 'info', 'Barang Masuk', '10 kg Daging Sapi Wagyu telah ditambahkan', true, new Date(Date.now() - 86400000)
    ]);
    
    // Seed Activity Logs
    console.log('📝 Seeding activity logs...');
    await client.query(`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6),
        ($7, $8, $9, $10, $11, $12),
        ($13, $14, $15, $16, $17, $18)
    `, [
      1, 'Login', 'user', 1, null, new Date(),
      1, 'Menambahkan barang: Daging Sapi Wagyu', 'barang', 1, '{"barangName":"Daging Sapi Wagyu"}', new Date(Date.now() - 3600000),
      2, 'Mencatat barang masuk', 'transaksi_masuk', 1, null, new Date(Date.now() - 7200000)
    ]);
    
    await client.query('COMMIT');
    
    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('   Super Admin: superadmin@papaloma.id / password123');
    console.log('   Admin: admin@papaloma.id / password123');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('Seeding error:', error);
  process.exit(1);
});