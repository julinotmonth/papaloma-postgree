# Troubleshooting Guide - Papaloma PostgreSQL Backend

## ❌ Error: "Failed to load resource: the server responded with a status of 500"

### Login Error: "Illegal arguments: string, undefined"

**Symptoms:**
```
Login error: Error: Illegal arguments: string, undefined
    at bcrypt.compareSync
    at User.verifyPassword
```

**Root Cause:**
Password field di database adalah NULL atau undefined, sehingga bcrypt tidak bisa compare password.

**Solutions:**

### Option 1: Quick Fix - Reseed Password Saja

```bash
# Jalankan script fix password
npm run db:fix-passwords
```

Script ini akan:
- Update password untuk semua users menjadi `password123`
- Tidak menghapus data lain

### Option 2: Debug Dulu

```bash
# Check user data di database
npm run db:debug
```

Output yang benar:
```
Found 2 users:

ID: 1
Name: Super Admin
Email: superadmin@papaloma.id
Role: super_admin
Status: active
Password hash: $2a$10$xxxxxxxxxxxxx...
Password length: 60
---

ID: 2
Name: Admin Restoran
Email: admin@papaloma.id
Role: admin
Status: active
Password hash: $2a$10$xxxxxxxxxxxxx...
Password length: 60
---
```

**Jika password NULL/undefined atau status bukan active**, jalankan fix:
```bash
npm run db:fix-all
```

## ❌ Error: "Akun tidak aktif" (403 Forbidden)

**Symptoms:**
```
GET http://localhost:3000/api/barang 403 (Forbidden)
GET http://localhost:3000/api/kategori 403 (Forbidden)
Error: Akun tidak aktif
```

Di frontend muncul notifikasi: **"⚠️ Akun tidak aktif"**

**Root Cause:**
User berhasil login tapi field `status` di database bukan `'active'` (bisa NULL, 'inactive', atau value lain).

**Solutions:**

### Quick Fix (Recommended):

```bash
# Fix semua user issues sekaligus (password + status + role)
npm run db:fix-all
```

Script ini akan:
- ✅ Set password = `password123` (hashed)
- ✅ Set status = `active`
- ✅ Set role dengan benar (super_admin / admin)
- ✅ Verify hasilnya
- ✅ Tidak menghapus data lain

**Output yang diharapkan:**
```
🔧 Complete User Fix Script

📊 Current user state:
Found 2 users:

- Super Admin (superadmin@papaloma.id)
  Role: super_admin
  Status: inactive  ← PROBLEM
  Password: SET (60 chars)

🔧 Fixing Super Admin...
✅ Super Admin fixed:
   ID: 1
   Role: super_admin
   Status: active  ← FIXED!

📋 Final state:

✅ Super Admin (superadmin@papaloma.id)
   Role: super_admin
   Status: active
   Password: OK (60 chars)

✅ All users fixed successfully!
```

### Manual Fix (via SQL):

```bash
# Connect to database
psql -h localhost -U papaloma_user -d papaloma_db
```

```sql
-- Check current status
SELECT id, name, email, role, status FROM users;

-- Fix status
UPDATE users SET status = 'active' WHERE email IN ('superadmin@papaloma.id', 'admin@papaloma.id');

-- Verify
SELECT id, name, email, role, status FROM users;
```

### After Fix:

```bash
# Restart server
npm run dev

# Test login
# Seharusnya tidak ada error "Akun tidak aktif" lagi
```

### Option 3: Full Reseed (Menghapus semua data)

```bash
# WARNING: Ini akan menghapus SEMUA data!
npm run db:migrate
npm run db:seed
```

## ❌ Error: "connect ECONNREFUSED 127.0.0.1:5432"

**Root Cause:**
PostgreSQL server tidak berjalan atau tidak bisa diakses.

**Solutions:**

### If using Docker:
```bash
# Check if container is running
docker ps

# If not running, start it
docker-compose up -d

# Check logs
docker-compose logs postgres
```

### If using local PostgreSQL:
```bash
# Ubuntu/Debian
sudo systemctl status postgresql
sudo systemctl start postgresql

# macOS
brew services start postgresql

# Check if listening on port 5432
sudo netstat -plnt | grep 5432
```

### Check .env configuration:
```env
DB_HOST=localhost      # or your host
DB_PORT=5432
DB_NAME=papaloma_db
DB_USER=papaloma_user
DB_PASSWORD=your_password
```

## ❌ Error: "password authentication failed"

**Root Cause:**
Username atau password salah di .env

**Solutions:**

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Check user exists
\du

# If user doesn't exist, create it
CREATE USER papaloma_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE papaloma_db TO papaloma_user;

# Exit
\q
```

Update `.env` dengan password yang benar.

## ❌ Error: "relation 'users' does not exist"

**Root Cause:**
Tables belum dibuat (migration belum dijalankan)

**Solutions:**

```bash
# Run migration
npm run db:migrate

# Then seed
npm run db:seed
```

## ❌ Error: "duplicate key value violates unique constraint"

**Root Cause:**
Mencoba insert data yang sudah ada (biasanya saat seed ulang)

**Solutions:**

### Option 1: Drop dan recreate database
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Drop database
DROP DATABASE papaloma_db;
CREATE DATABASE papaloma_db;
GRANT ALL PRIVILEGES ON DATABASE papaloma_db TO papaloma_user;
\q

# Run migration dan seed
npm run db:migrate
npm run db:seed
```

### Option 2: Truncate tables (keep structure)
```bash
# Connect to database
psql -h localhost -U papaloma_user -d papaloma_db

# Truncate all tables
TRUNCATE TABLE activity_logs CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE transaksi_keluar CASCADE;
TRUNCATE TABLE transaksi_masuk CASCADE;
TRUNCATE TABLE barang CASCADE;
TRUNCATE TABLE kategori CASCADE;
TRUNCATE TABLE users CASCADE;

# Exit
\q

# Seed again
npm run db:seed
```

## ❌ Frontend: CORS Error

**Symptoms:**
```
Access to fetch at 'http://localhost:3000/api/auth/login' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solutions:**

Update `.env`:
```env
CORS_ORIGIN=http://localhost:5173
```

Or for multiple origins, update `src/index.js`:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
```

## ❌ Error: Port 3000 already in use

**Solutions:**

### Option 1: Kill existing process
```bash
# Find process
lsof -ti:3000

# Kill it
kill -9 $(lsof -ti:3000)
```

### Option 2: Change port
Update `.env`:
```env
PORT=3001
```

## 🔍 General Debugging Steps

### 1. Check Database Connection
```bash
# Test connection with psql
psql -h localhost -U papaloma_user -d papaloma_db

# Should connect successfully
# If it works, type \q to exit
```

### 2. Check Tables Exist
```sql
-- In psql
\dt

-- Should show:
-- users, kategori, barang, transaksi_masuk, 
-- transaksi_keluar, notifications, activity_logs
```

### 3. Check User Data
```bash
npm run db:debug
```

### 4. Check Server Logs
Look for specific error messages in the console when starting the server.

### 5. Test API Manually
```bash
# Health check
curl http://localhost:3000/api/health

# Should return: {"success":true,"message":"Papaloma API is running",...}
```

## 🛠️ Complete Reset (Nuclear Option)

If nothing works, completely reset everything:

```bash
# 1. Stop server (Ctrl+C)

# 2. If using Docker, stop and remove everything
docker-compose down -v

# 3. Start fresh
docker-compose up -d

# 4. Wait for PostgreSQL to be ready
sleep 5

# 5. Run migration and seed
npm run db:migrate
npm run db:seed

# 6. Start server
npm run dev
```

## 📞 Still Having Issues?

1. Check that all dependencies are installed: `npm install`
2. Check Node.js version: `node -v` (should be 18+)
3. Check PostgreSQL version: `psql --version` (should be 12+)
4. Check `.env` file exists and has correct values
5. Check firewall/antivirus not blocking port 5432 or 3000

## 🔧 Useful Commands

```bash
# Database
npm run db:migrate       # Create tables
npm run db:seed          # Add sample data
npm run db:debug         # Check user data
npm run db:fix-passwords # Fix password issues only
npm run db:fix-all       # Fix ALL user issues (password + status + role) ← RECOMMENDED

# Server
npm run dev              # Development mode
npm start                # Production mode

# Docker
docker-compose up -d     # Start PostgreSQL
docker-compose down      # Stop PostgreSQL
docker-compose logs      # View logs
docker-compose ps        # Check status
```

## 📝 Checklist Before Asking for Help

- [ ] PostgreSQL is running (`docker ps` or `systemctl status postgresql`)
- [ ] Database exists and accessible (`psql -h localhost -U papaloma_user -d papaloma_db`)
- [ ] Tables exist (`\dt` in psql)
- [ ] Migration ran successfully (`npm run db:migrate`)
- [ ] Seed ran successfully (`npm run db:seed`)
- [ ] User passwords are not NULL (`npm run db:debug`)
- [ ] .env file is configured correctly
- [ ] Dependencies installed (`npm install`)
- [ ] No port conflicts (3000, 5432)
- [ ] Checked server logs for specific errors
