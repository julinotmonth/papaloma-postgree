# Panduan Migrasi Data dari SQLite ke PostgreSQL

Jika Anda sudah memiliki data di database SQLite dan ingin memindahkannya ke PostgreSQL, ikuti langkah-langkah berikut:

## Metode 1: Menggunakan pgloader (Recommended)

### 1. Install pgloader

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install pgloader
```

**macOS:**
```bash
brew install pgloader
```

**Windows:**
Download dari: https://github.com/dimitri/pgloader/releases

### 2. Buat File Konfigurasi pgloader

Buat file `migrate.load`:

```lisp
LOAD DATABASE
     FROM sqlite://./database/papaloma.db
     INTO postgresql://papaloma_user:papaloma_password@localhost:5432/papaloma_db

WITH include drop, create tables, create indexes, reset sequences

SET work_mem to '16MB', maintenance_work_mem to '512 MB';
```

### 3. Jalankan Migrasi

```bash
pgloader migrate.load
```

## Metode 2: Export/Import Manual via CSV

### 1. Export Data dari SQLite ke CSV

Buat script `export_sqlite.js`:

```javascript
import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./database/papaloma.db');

// Function to export table to CSV
function exportTableToCSV(tableName) {
  const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
  
  if (rows.length === 0) {
    console.log(`${tableName}: No data to export`);
    return;
  }
  
  const headers = Object.keys(rows[0]).join(',');
  const csvContent = [
    headers,
    ...rows.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    )
  ].join('\n');
  
  fs.writeFileSync(`./exports/${tableName}.csv`, csvContent);
  console.log(`✅ Exported ${tableName}: ${rows.length} rows`);
}

// Create exports directory
if (!fs.existsSync('./exports')) {
  fs.mkdirSync('./exports');
}

// Export all tables
const tables = ['users', 'kategori', 'barang', 'transaksi_masuk', 
                'transaksi_keluar', 'notifications', 'activity_logs'];

tables.forEach(exportTableToCSV);

db.close();
console.log('\n✅ All exports completed!');
```

Jalankan:
```bash
npm install better-sqlite3
node export_sqlite.js
```

### 2. Import CSV ke PostgreSQL

Buat script `import_postgres.js`:

```javascript
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import csv from 'csv-parser';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'papaloma_db',
  user: 'papaloma_user',
  password: 'papaloma_password',
});

async function importCSV(tableName, filePath) {
  const client = await pool.connect();
  
  try {
    const rows = [];
    
    // Read CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });
    
    if (rows.length === 0) {
      console.log(`${tableName}: No data to import`);
      return;
    }
    
    // Get columns
    const columns = Object.keys(rows[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    // Insert data
    await client.query('BEGIN');
    
    for (const row of rows) {
      const values = columns.map(col => row[col] === '' ? null : row[col]);
      
      await client.query(
        `INSERT INTO ${tableName} (${columns.join(', ')}) 
         VALUES (${placeholders})`,
        values
      );
    }
    
    await client.query('COMMIT');
    console.log(`✅ Imported ${tableName}: ${rows.length} rows`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Error importing ${tableName}:`, error.message);
  } finally {
    client.release();
  }
}

async function importAll() {
  const tables = [
    'users',
    'kategori', 
    'barang',
    'transaksi_masuk',
    'transaksi_keluar',
    'notifications',
    'activity_logs'
  ];
  
  for (const table of tables) {
    await importCSV(table, `./exports/${table}.csv`);
  }
  
  // Reset sequences
  const client = await pool.connect();
  try {
    for (const table of tables) {
      await client.query(`
        SELECT setval('${table}_id_seq', 
          COALESCE((SELECT MAX(id) FROM ${table}), 1))
      `);
    }
    console.log('\n✅ Sequences reset successfully');
  } finally {
    client.release();
  }
  
  await pool.end();
  console.log('\n✅ All imports completed!');
}

importAll().catch(console.error);
```

Jalankan:
```bash
npm install csv-parser
node import_postgres.js
```

## Metode 3: Menggunakan Script Custom (Simple)

Buat script `migrate_data.js`:

```javascript
import Database from 'better-sqlite3';
import pkg from 'pg';
const { Pool } = pkg;

// SQLite connection
const sqlite = new Database('./database/papaloma.db');

// PostgreSQL connection
const pg = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'papaloma_db',
  user: 'papaloma_user',
  password: 'papaloma_password',
});

async function migrateTable(tableName, columns) {
  console.log(`\nMigrating ${tableName}...`);
  
  // Get data from SQLite
  const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all();
  console.log(`Found ${rows.length} rows in ${tableName}`);
  
  if (rows.length === 0) return;
  
  const client = await pg.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert into PostgreSQL
    for (const row of rows) {
      const values = columns.map(col => row[col]);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      await client.query(
        `INSERT INTO ${tableName} (${columns.join(', ')}) 
         VALUES (${placeholders})`,
        values
      );
    }
    
    await client.query('COMMIT');
    console.log(`✅ Migrated ${tableName}: ${rows.length} rows`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Error migrating ${tableName}:`, error.message);
  } finally {
    client.release();
  }
}

async function migrate() {
  try {
    // Migrate users
    await migrateTable('users', [
      'id', 'name', 'email', 'password', 'role', 'status', 
      'avatar', 'last_login', 'created_at', 'updated_at'
    ]);
    
    // Migrate kategori
    await migrateTable('kategori', [
      'id', 'name', 'description', 'created_at', 'updated_at'
    ]);
    
    // Migrate barang
    await migrateTable('barang', [
      'id', 'name', 'kategori_id', 'satuan', 'stok', 'stok_minimum',
      'harga_per_unit', 'lokasi', 'kondisi', 'tanggal_kadaluarsa',
      'catatan', 'created_at', 'updated_at'
    ]);
    
    // Migrate transaksi_masuk
    await migrateTable('transaksi_masuk', [
      'id', 'barang_id', 'jumlah', 'tanggal', 'supplier',
      'catatan', 'created_by', 'created_at'
    ]);
    
    // Migrate transaksi_keluar
    await migrateTable('transaksi_keluar', [
      'id', 'barang_id', 'jumlah', 'tanggal', 'alasan',
      'catatan', 'created_by', 'created_at'
    ]);
    
    // Migrate notifications
    await migrateTable('notifications', [
      'id', 'user_id', 'type', 'title', 'message', 'read', 'created_at'
    ]);
    
    // Migrate activity_logs
    await migrateTable('activity_logs', [
      'id', 'user_id', 'action', 'entity_type', 'entity_id',
      'details', 'created_at'
    ]);
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    sqlite.close();
    await pg.end();
  }
}

migrate();
```

Jalankan:
```bash
npm install better-sqlite3
node migrate_data.js
```

## Verification Checklist

Setelah migrasi, verifikasi data dengan query berikut di PostgreSQL:

```sql
-- Check row counts
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'kategori', COUNT(*) FROM kategori
UNION ALL
SELECT 'barang', COUNT(*) FROM barang
UNION ALL
SELECT 'transaksi_masuk', COUNT(*) FROM transaksi_masuk
UNION ALL
SELECT 'transaksi_keluar', COUNT(*) FROM transaksi_keluar
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'activity_logs', COUNT(*) FROM activity_logs;

-- Check data integrity
SELECT b.name, b.stok, k.name as kategori
FROM barang b
JOIN kategori k ON b.kategori_id = k.id
LIMIT 10;

-- Verify sequences
SELECT 
  schemaname,
  sequencename,
  last_value
FROM pg_sequences
WHERE schemaname = 'public';
```

## Troubleshooting

### Error: Duplicate key value violates unique constraint

Reset sequences:
```sql
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('kategori_id_seq', (SELECT MAX(id) FROM kategori));
SELECT setval('barang_id_seq', (SELECT MAX(id) FROM barang));
-- dan seterusnya untuk semua table
```

### Error: Data type mismatch

Pastikan data types sesuai:
- Boolean: SQLite (0/1) → PostgreSQL (FALSE/TRUE)
- Timestamps: Format ISO 8601 konsisten

### Error: Foreign key constraint violation

Import data dalam urutan yang benar:
1. users
2. kategori
3. barang
4. transaksi_masuk
5. transaksi_keluar
6. notifications
7. activity_logs

## Notes

- **Backup First**: Selalu backup database SQLite sebelum migrasi
- **Test Environment**: Test migrasi di environment development dulu
- **Downtime**: Rencanakan maintenance window untuk production
- **Verification**: Verifikasi semua data dan foreign keys setelah migrasi
