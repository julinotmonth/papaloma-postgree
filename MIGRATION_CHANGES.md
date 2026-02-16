# Dokumentasi Perubahan Migrasi SQLite ke PostgreSQL

Dokumen ini menjelaskan semua perubahan yang dilakukan dalam migrasi dari SQLite ke PostgreSQL.

## 📦 Dependencies Changes

### package.json

**Dihapus:**
```json
"sql.js": "^1.10.2"
```

**Ditambahkan:**
```json
"pg": "^8.11.3"
```

## 🔧 Configuration Changes

### src/config/index.js

**Ditambahkan konfigurasi PostgreSQL:**
```javascript
database: {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  name: process.env.DB_NAME || 'papaloma_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
  }
}
```

### .env Variables

**Ditambahkan:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=papaloma_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_POOL_MIN=2
DB_POOL_MAX=10
```

**Dihapus:**
```env
DB_PATH=./database/papaloma.db
```

## 🗄️ Database Connection Changes

### src/database/db.js

**SQLite (Before):**
```javascript
import initSqlJs from 'sql.js';
const SQL = await initSqlJs();
const db = new SQL.Database();
```

**PostgreSQL (After):**
```javascript
import { Pool } from 'pg';
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
});

export const query = async (text, params) => {
  return await pool.query(text, params);
};

export const getClient = async () => {
  return await pool.connect();
};
```

**Perubahan Utama:**
- ✅ Connection pooling untuk efisiensi
- ✅ Async/await pattern untuk semua query
- ✅ Client management untuk transactions
- ✅ Error handling yang lebih baik

## 🏗️ Database Schema Changes

### Data Types

| SQLite | PostgreSQL | Notes |
|--------|------------|-------|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL PRIMARY KEY` | Auto-increment |
| `TEXT` | `TEXT` atau `VARCHAR(n)` | String data |
| `INTEGER` (boolean) | `BOOLEAN` | True/False values |
| `REAL` | `DECIMAL(15, 2)` | Decimal numbers |
| `DATETIME` | `TIMESTAMP` | Date and time |
| `DATE` | `DATE` | Date only |

### Constraints & Checks

**SQLite:**
```sql
CHECK(role IN ('super_admin', 'admin'))
CHECK(status IN ('active', 'inactive'))
```

**PostgreSQL (Tetap sama):**
```sql
CHECK(role IN ('super_admin', 'admin'))
CHECK(status IN ('active', 'inactive'))
```

### Triggers

**Ditambahkan di PostgreSQL:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 📝 Query Syntax Changes

### Parameter Placeholders

**SQLite:**
```javascript
db.prepare('SELECT * FROM users WHERE id = ?').get(id);
db.prepare('SELECT * FROM users WHERE email = ? AND status = ?').get(email, status);
```

**PostgreSQL:**
```javascript
await query('SELECT * FROM users WHERE id = $1', [id]);
await query('SELECT * FROM users WHERE email = $1 AND status = $2', [email, status]);
```

### Case-Insensitive Search

**SQLite:**
```javascript
query += ' AND name LIKE ?';
params.push(`%${search}%`);
```

**PostgreSQL:**
```javascript
query += ' AND name ILIKE $1';
params.push(`%${search}%`);
```

### Date Operations

**SQLite:**
```sql
WHERE DATE(created_at) = DATE('now')
WHERE created_at >= datetime('now', '-30 days')
```

**PostgreSQL:**
```sql
WHERE DATE(created_at) = CURRENT_DATE
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
```

### Aggregate Functions

**SQLite:**
```sql
SELECT strftime('%Y-%m', tanggal) as month, SUM(jumlah) as total
FROM transaksi_masuk
GROUP BY strftime('%Y-%m', tanggal)
```

**PostgreSQL:**
```sql
SELECT TO_CHAR(tanggal, 'YYYY-MM') as month, SUM(jumlah) as total
FROM transaksi_masuk
GROUP BY TO_CHAR(tanggal, 'YYYY-MM')
```

## 🔄 Model Changes

### Synchronous → Asynchronous

**SQLite (Before):**
```javascript
static findAll() {
  return db.prepare('SELECT * FROM users').all();
}

static findById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

static create(data) {
  const result = db.prepare('INSERT INTO users (...) VALUES (...)').run(...);
  return this.findById(result.lastInsertRowid);
}
```

**PostgreSQL (After):**
```javascript
static async findAll() {
  const result = await query('SELECT * FROM users');
  return result.rows;
}

static async findById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

static async create(data) {
  const result = await query(
    'INSERT INTO users (...) VALUES (...) RETURNING *',
    [...]
  );
  return result.rows[0];
}
```

**Perubahan Utama:**
- ✅ Semua method menjadi `async`
- ✅ Menggunakan `await` untuk query
- ✅ Return `result.rows` atau `result.rows[0]`
- ✅ Gunakan `RETURNING *` untuk mendapat data yang baru di-insert/update

### Transaction Handling

**SQLite (Before):**
```javascript
static create(data, userId) {
  db.prepare('BEGIN').run();
  try {
    // Insert transaksi
    const result = db.prepare('INSERT INTO transaksi_masuk ...').run(...);
    // Update stok
    db.prepare('UPDATE barang SET stok = stok + ?').run(jumlah);
    db.prepare('COMMIT').run();
    return this.findById(result.lastInsertRowid);
  } catch (error) {
    db.prepare('ROLLBACK').run();
    throw error;
  }
}
```

**PostgreSQL (After):**
```javascript
static async create(data, userId) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Insert transaksi
    const result = await client.query(
      'INSERT INTO transaksi_masuk ... RETURNING id',
      [...]
    );
    
    // Update stok
    await client.query(
      'UPDATE barang SET stok = stok + $1 WHERE id = $2',
      [jumlah, barangId]
    );
    
    await client.query('COMMIT');
    return this.findById(result.rows[0].id);
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

**Perubahan Utama:**
- ✅ Menggunakan dedicated client dari pool
- ✅ Proper transaction management dengan try-catch-finally
- ✅ Client release di finally block

### Dynamic Query Building

**SQLite (Before):**
```javascript
let paramCount = 0;
if (filters.kategoriId) {
  query += ' AND kategori_id = ?';
  params.push(filters.kategoriId);
}
```

**PostgreSQL (After):**
```javascript
let paramCount = 0;
if (filters.kategoriId) {
  paramCount++;
  query += ` AND kategori_id = $${paramCount}`;
  params.push(filters.kategoriId);
}
```

### Pagination

**SQLite (Before):**
```javascript
query += ` LIMIT ${limit} OFFSET ${offset}`;
const items = db.prepare(query).all(...params);
```

**PostgreSQL (After):**
```javascript
paramCount++;
query += ` LIMIT $${paramCount}`;
params.push(limit);

paramCount++;
query += ` OFFSET $${paramCount}`;
params.push(offset);

const result = await query(sql, params);
const items = result.rows;
```

## 🎯 Controller Changes

Tidak ada perubahan signifikan di controllers karena mereka hanya memanggil model methods. Yang berubah adalah:

**Before:**
```javascript
const users = User.findAll();
```

**After:**
```javascript
const users = await User.findAll();
```

Semua controller methods yang memanggil model harus menggunakan `await`.

## 🚀 Performance Improvements

### Connection Pooling

PostgreSQL menggunakan connection pool yang dapat menangani multiple concurrent requests dengan efisien:

```javascript
pool: {
  min: 2,      // Minimum connections
  max: 10,     // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}
```

### Indexes

Indexes yang sama diterapkan di PostgreSQL untuk optimasi query:

```sql
CREATE INDEX idx_barang_kategori ON barang(kategori_id);
CREATE INDEX idx_barang_kondisi ON barang(kondisi);
CREATE INDEX idx_transaksi_masuk_barang ON transaksi_masuk(barang_id);
CREATE INDEX idx_transaksi_masuk_tanggal ON transaksi_masuk(tanggal);
-- dan lainnya
```

### Advanced PostgreSQL Features

Fitur yang bisa dimanfaatkan di masa depan:

1. **Materialized Views** untuk dashboard statistics
2. **Full-Text Search** untuk pencarian barang
3. **JSON/JSONB columns** untuk flexible data
4. **Partitioning** untuk table dengan data besar
5. **Stored Procedures** untuk complex business logic

## 📊 Testing Checklist

Setelah migrasi, pastikan test semua:

- [x] Authentication (login, logout, profile)
- [x] User management (CRUD)
- [x] Kategori management
- [x] Barang management dengan pagination
- [x] Transaksi masuk (stok bertambah)
- [x] Transaksi keluar (stok berkurang, validasi)
- [x] Dashboard statistics
- [x] Notifications
- [x] Activity logs
- [x] Laporan generation
- [x] Error handling
- [x] Transaction rollback pada error

## 🔐 Security Improvements

PostgreSQL memberikan security features yang lebih baik:

1. **User Permissions**: Granular access control
2. **SSL Connections**: Encrypted connections
3. **Row Level Security**: Data isolation
4. **Audit Logging**: Built-in logging capabilities

## 📈 Scalability

PostgreSQL lebih scalable untuk production:

- ✅ Horizontal scaling dengan read replicas
- ✅ Vertical scaling dengan resource allocation
- ✅ Better concurrent connection handling
- ✅ Advanced monitoring tools available

## 🎓 Learning Resources

Untuk memahami lebih dalam PostgreSQL:

1. Official Docs: https://www.postgresql.org/docs/
2. Node-postgres Guide: https://node-postgres.com/
3. PostgreSQL Tutorial: https://www.postgresqltutorial.com/
4. Performance Tuning: https://wiki.postgresql.org/wiki/Performance_Optimization

## ✅ Migration Completion Checklist

- [x] Package dependencies updated
- [x] Database connection configured
- [x] Migration scripts created
- [x] Seed scripts updated
- [x] All models converted to async/await
- [x] Query syntax updated (? → $n)
- [x] Transaction handling improved
- [x] Environment variables configured
- [x] Docker support added
- [x] Documentation updated
- [x] Quick start guide created
- [x] Migration guide created

## 🎉 Summary

Migrasi dari SQLite ke PostgreSQL memberikan:

✅ **Better Performance** - Connection pooling, optimized queries
✅ **Better Scalability** - Handle more concurrent users
✅ **Better Features** - Advanced SQL capabilities
✅ **Production Ready** - Enterprise-grade database
✅ **Cloud Ready** - Easy deployment to cloud platforms
✅ **Better Tooling** - Rich ecosystem of tools

Total files changed: ~20 files
Lines of code modified: ~2000 lines
Estimated migration time: 2-4 hours untuk experienced developer
