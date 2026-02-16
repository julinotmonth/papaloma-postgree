# Papaloma Inventory Backend API (PostgreSQL)

Backend API untuk sistem manajemen inventaris Restoran Papaloma, **dimigrasi dari SQLite ke PostgreSQL**.

## 🔄 Migrasi dari SQLite ke PostgreSQL

Project ini adalah hasil migrasi dari backend yang menggunakan SQLite (`sql.js`) menjadi PostgreSQL (`pg`).

### Perubahan Utama dalam Migrasi:

1. **Database Driver**
   - **Sebelum**: `sql.js` (SQLite in-memory/file-based)
   - **Sesudah**: `pg` (PostgreSQL dengan connection pooling)

2. **Query Syntax**
   - **Parameter Placeholder**: 
     - SQLite: `?` → PostgreSQL: `$1, $2, $3...`
   - **String Matching**:
     - SQLite: `LIKE` → PostgreSQL: `ILIKE` (case-insensitive)
   - **Auto-increment**:
     - SQLite: `AUTOINCREMENT` → PostgreSQL: `SERIAL`
   - **Boolean**:
     - SQLite: `INTEGER (0/1)` → PostgreSQL: `BOOLEAN (TRUE/FALSE)`
   - **Datetime Functions**:
     - SQLite: `CURRENT_TIMESTAMP` → PostgreSQL: `CURRENT_TIMESTAMP`, `NOW()`
     - Date operations: `INTERVAL`, `DATE_TRUNC()`

3. **Data Types**
   - **Decimal**: `REAL` → `DECIMAL(15, 2)`
   - **Text**: `TEXT` tetap sama, ditambah `VARCHAR(n)` untuk constraint
   - **Date/Time**: Lebih banyak opsi di PostgreSQL (`TIMESTAMP`, `DATE`, `TIME`)

4. **Transaction Management**
   - **SQLite**: Synchronous operations
   - **PostgreSQL**: Async/await dengan client pooling

5. **Triggers & Functions**
   - PostgreSQL mendukung stored procedures dan triggers yang lebih powerful
   - Menambahkan auto-update `updated_at` menggunakan trigger

## 🚀 Fitur

- **Autentikasi JWT** - Login/logout dengan token
- **Role-based Access Control** - Super Admin dan Admin
- **CRUD Barang** - Kelola data barang inventaris
- **Transaksi Masuk/Keluar** - Catat pergerakan stok
- **Dashboard Stats** - Statistik dan chart data
- **Laporan** - Generate berbagai jenis laporan
- **Notifikasi** - Alert stok rendah dan aktivitas
- **Activity Logs** - Riwayat aktivitas user
- **Connection Pooling** - Optimasi koneksi database
- **Transaction Support** - ACID compliance untuk data consistency

## 📋 Prasyarat

- **Node.js** v18+
- **PostgreSQL** v12+ (local atau remote)
- **npm** atau **yarn**

## 🛠️ Instalasi

### 1. Clone atau Extract Project

```bash
cd papaloma-postgresql
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup PostgreSQL Database

**Option A: PostgreSQL Local**

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql
postgres=# CREATE DATABASE papaloma_db;
postgres=# CREATE USER papaloma_user WITH ENCRYPTED PASSWORD 'your_password';
postgres=# GRANT ALL PRIVILEGES ON DATABASE papaloma_db TO papaloma_user;
postgres=# \q
```

**Option B: PostgreSQL di Docker**

```bash
docker run --name papaloma-postgres \
  -e POSTGRES_DB=papaloma_db \
  -e POSTGRES_USER=papaloma_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:15-alpine
```

**Option C: Cloud PostgreSQL** (Railway, Supabase, Render, etc.)

Dapatkan connection string dari provider cloud Anda.

### 4. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi PostgreSQL Anda:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=papaloma_db
DB_USER=papaloma_user
DB_PASSWORD=your_password

# Database Pool Configuration
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### 5. Run Database Migration

```bash
npm run db:migrate
```

Output yang diharapkan:
```
🚀 Starting database migration...
🗑️  Dropping existing tables...
👤 Creating users table...
📁 Creating kategori table...
📦 Creating barang table...
📥 Creating transaksi_masuk table...
📤 Creating transaksi_keluar table...
🔔 Creating notifications table...
📝 Creating activity_logs table...
🔍 Creating indexes...
⚡ Creating triggers...
✅ Migration completed successfully!
```

### 6. Seed Database dengan Data Awal

```bash
npm run db:seed
```

Output yang diharapkan:
```
🌱 Seeding database...
👤 Seeding users...
📁 Seeding kategori...
📦 Seeding barang...
📥 Seeding transaksi masuk...
📤 Seeding transaksi keluar...
🔔 Seeding notifications...
📝 Seeding activity logs...
✅ Database seeded successfully!

📋 Demo Accounts:
   Super Admin: superadmin@papaloma.id / password123
   Admin: admin@papaloma.id / password123
```

### 7. Jalankan Server

```bash
# Development (dengan auto-reload)
npm run dev

# Production
npm start
```

Server akan berjalan di `http://localhost:3000`

## 🔐 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@papaloma.id | password123 |
| Admin | admin@papaloma.id | password123 |

## 📚 API Endpoints

Semua endpoint sama dengan versi SQLite. Dokumentasi lengkap tersedia di README asli.

### Authentication
```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
PUT    /api/auth/profile
PUT    /api/auth/change-password
```

### Core Endpoints
```
GET/POST/PUT/DELETE   /api/users
GET/POST/PUT/DELETE   /api/kategori
GET/POST/PUT/DELETE   /api/barang
GET/POST              /api/transaksi-masuk
GET/POST              /api/transaksi-keluar
GET                   /api/dashboard/*
GET                   /api/notifications
GET                   /api/laporan/*
GET                   /api/activity-logs
```

## 🔧 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Server port | 3000 | No |
| NODE_ENV | Environment | development | No |
| JWT_SECRET | JWT secret key | - | **Yes** |
| JWT_EXPIRES_IN | Token expiry | 7d | No |
| DB_HOST | PostgreSQL host | localhost | **Yes** |
| DB_PORT | PostgreSQL port | 5432 | **Yes** |
| DB_NAME | Database name | papaloma_db | **Yes** |
| DB_USER | Database user | postgres | **Yes** |
| DB_PASSWORD | Database password | - | **Yes** |
| DB_POOL_MIN | Min pool connections | 2 | No |
| DB_POOL_MAX | Max pool connections | 10 | No |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:5173 | No |

## 📁 Struktur Project

```
papaloma-postgresql/
├── src/
│   ├── config/           # Configuration (database, jwt, etc)
│   ├── controllers/      # Request handlers
│   ├── database/         # Database connection, migrate, seed
│   ├── middleware/       # Auth, validation, error handling
│   ├── models/           # Data models (PostgreSQL queries)
│   ├── routes/           # API routes
│   ├── utils/            # Helper utilities
│   └── index.js          # App entry point
├── uploads/              # File uploads directory
├── .env                  # Environment variables
├── .env.example          # Environment template
├── package.json
└── README.md
```

## 🔄 Perbandingan SQLite vs PostgreSQL

### Keuntungan PostgreSQL:

✅ **Scalability** - Lebih cocok untuk production dengan banyak concurrent users
✅ **Data Integrity** - ACID compliance yang lebih baik
✅ **Advanced Features** - Stored procedures, triggers, views, full-text search
✅ **Concurrency** - Better handling untuk multiple connections
✅ **Performance** - Lebih cepat untuk dataset besar
✅ **Cloud Ready** - Mudah deploy ke cloud services
✅ **JSON Support** - Native JSON/JSONB untuk data semi-structured
✅ **Full-Text Search** - Built-in text search capabilities

### Trade-offs:

⚠️ **Setup Complexity** - Memerlukan PostgreSQL server
⚠️ **Resource Usage** - Lebih banyak memory dan storage
⚠️ **Learning Curve** - Syntax PostgreSQL lebih kompleks

## 🐛 Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solusi**:
1. Pastikan PostgreSQL service berjalan: `sudo systemctl status postgresql`
2. Check konfigurasi di `.env`
3. Verify PostgreSQL listening on correct port: `sudo netstat -plnt | grep 5432`

### Authentication Failed

```
Error: password authentication failed for user "papaloma_user"
```

**Solusi**:
1. Cek username dan password di `.env`
2. Verify user permissions:
   ```bash
   sudo -u postgres psql
   postgres=# \du
   ```

### Migration Failed

```
Error: relation "users" already exists
```

**Solusi**:
1. Drop dan recreate database:
   ```bash
   sudo -u postgres psql
   postgres=# DROP DATABASE papaloma_db;
   postgres=# CREATE DATABASE papaloma_db;
   ```
2. Jalankan ulang migration: `npm run db:migrate`

## 📊 Database Schema

### Tables

1. **users** - User accounts dengan role (super_admin, admin)
2. **kategori** - Kategori barang
3. **barang** - Inventaris barang dengan stok tracking
4. **transaksi_masuk** - Record barang masuk dari supplier
5. **transaksi_keluar** - Record pemakaian/keluar barang
6. **notifications** - Sistem notifikasi
7. **activity_logs** - Audit trail aktivitas user

### Relationships

```
users (1) ─── (N) activity_logs
users (1) ─── (N) notifications
users (1) ─── (N) transaksi_masuk (created_by)
users (1) ─── (N) transaksi_keluar (created_by)

kategori (1) ─── (N) barang

barang (1) ─── (N) transaksi_masuk
barang (1) ─── (N) transaksi_keluar
```

## 🚀 Deployment

### Deploy ke Railway

1. Push code ke GitHub
2. Connect repository di Railway
3. Add PostgreSQL plugin
4. Set environment variables dari database credentials
5. Deploy!

### Deploy ke Render

1. Push code ke GitHub
2. Create new Web Service
3. Create PostgreSQL database
4. Link database ke web service
5. Set environment variables
6. Deploy!

### Deploy ke Heroku

```bash
# Install Heroku CLI
heroku login
heroku create papaloma-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:migrate
heroku run npm run db:seed
```

## 📝 Notes

- Pastikan selalu backup database sebelum migration di production
- Gunakan environment variables untuk sensitive data
- Monitor database connection pool usage
- Set proper indexes untuk query optimization
- Gunakan transactions untuk operasi multi-step yang critical

## 🐛 Troubleshooting

Jika mengalami masalah seperti:
- ❌ Login error: "Illegal arguments: string, undefined"
- ❌ "connect ECONNREFUSED" 
- ❌ "password authentication failed"
- ❌ "relation 'users' does not exist"

**Lihat panduan lengkap di:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Quick Fix untuk Login Error:

```bash
# Debug user data
npm run db:debug

# Fix password jika NULL/undefined
npm run db:fix-passwords
```

## 📞 Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository.

## 📄 License

MIT License
