# Quick Start Guide - Papaloma PostgreSQL Backend

Panduan cepat untuk menjalankan backend Papaloma dengan PostgreSQL dalam 5 menit!

## 🚀 Option 1: Menggunakan Docker (Termudah)

### Prerequisites
- Docker dan Docker Compose terinstall

### Steps

1. **Clone/Extract project**
   ```bash
   cd papaloma-postgresql
   ```

2. **Start PostgreSQL dengan Docker Compose**
   ```bash
   docker-compose up -d
   ```
   
   Ini akan menjalankan:
   - PostgreSQL di port 5432
   - pgAdmin di http://localhost:5050 (optional)

3. **Setup environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` jika perlu (default sudah cocok dengan docker-compose):
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=papaloma_db
   DB_USER=papaloma_user
   DB_PASSWORD=papaloma_password
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Run migration dan seed**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. **Start server**
   ```bash
   npm run dev
   ```

7. **Test API**
   ```bash
   # Health check
   curl http://localhost:3000/api/health
   
   # Login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@papaloma.id",
       "password": "password123"
     }'
   ```

## 🔧 Option 2: Menggunakan PostgreSQL Lokal

### Prerequisites
- PostgreSQL terinstall di sistem Anda
- Node.js 18+

### Steps

1. **Create database**
   ```bash
   sudo -u postgres psql
   ```
   
   ```sql
   CREATE DATABASE papaloma_db;
   CREATE USER papaloma_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE papaloma_db TO papaloma_user;
   \q
   ```

2. **Clone/Extract project**
   ```bash
   cd papaloma-postgresql
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` dengan kredensial database Anda:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=papaloma_db
   DB_USER=papaloma_user
   DB_PASSWORD=your_password
   JWT_SECRET=change-this-to-random-string
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Run migration dan seed**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. **Start server**
   ```bash
   npm run dev
   ```

## ☁️ Option 3: Menggunakan Cloud Database

### Using Railway

1. **Sign up di Railway.app**

2. **Create new project → Add PostgreSQL**
   
3. **Copy connection details**

4. **Setup .env**
   ```env
   DB_HOST=containers-us-west-xxx.railway.app
   DB_PORT=5432
   DB_NAME=railway
   DB_USER=postgres
   DB_PASSWORD=xxx-your-password-xxx
   JWT_SECRET=your-random-secret
   ```

5. **Install, migrate, seed, run**
   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

### Using Supabase

1. **Sign up di Supabase.com**

2. **Create new project**

3. **Get connection string** dari Settings → Database
   Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

4. **Setup .env**
   ```env
   DB_HOST=db.xxx.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your-password
   JWT_SECRET=your-random-secret
   ```

5. **Install, migrate, seed, run**
   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

## 📝 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@papaloma.id | password123 |
| Admin | admin@papaloma.id | password123 |

## 🧪 Testing API

### Using curl

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@papaloma.id","password":"password123"}' \
  | jq -r '.data.token')

# Get dashboard stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/dashboard/stats

# Get barang list
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/barang
```

### Using Postman/Insomnia

1. Import koleksi dari dokumentasi API
2. Set base URL: `http://localhost:3000/api`
3. Login untuk mendapatkan token
4. Tambahkan header: `Authorization: Bearer {token}`

## 🔍 Verifikasi Database

### Menggunakan psql

```bash
# Connect ke database
psql -h localhost -U papaloma_user -d papaloma_db

# Check tables
\dt

# Check data
SELECT * FROM users;
SELECT * FROM barang LIMIT 5;
SELECT COUNT(*) FROM transaksi_masuk;

# Exit
\q
```

### Menggunakan pgAdmin (Docker)

1. Buka http://localhost:5050
2. Login: admin@papaloma.id / admin123
3. Add server:
   - Host: postgres (atau localhost jika tidak pakai Docker)
   - Port: 5432
   - Database: papaloma_db
   - Username: papaloma_user
   - Password: papaloma_password

## 🛑 Stop Services

### Docker
```bash
# Stop containers
docker-compose down

# Stop and remove volumes (will delete data!)
docker-compose down -v
```

### Local
```bash
# Stop Node server: Ctrl+C

# Stop PostgreSQL (Ubuntu/Debian)
sudo systemctl stop postgresql
```

## ⚙️ Scripts Available

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with auto-reload |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with initial data |

## 📚 Next Steps

1. ✅ Explore API endpoints di `/api/health`
2. ✅ Read full documentation in `README.md`
3. ✅ Configure environment variables untuk production
4. ✅ Setup monitoring dan logging
5. ✅ Deploy ke production

## 🆘 Troubleshooting

### Cannot connect to database

```bash
# Check PostgreSQL is running
docker ps  # for Docker
sudo systemctl status postgresql  # for local

# Check port 5432
sudo netstat -plnt | grep 5432
```

### Migration fails

```bash
# Drop and recreate database
psql -U postgres
DROP DATABASE papaloma_db;
CREATE DATABASE papaloma_db;
\q

# Run migration again
npm run db:migrate
```

### Port 3000 already in use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or change PORT in .env
PORT=3001
```

## 📞 Need Help?

- Check `README.md` untuk dokumentasi lengkap
- Check `MIGRATION_GUIDE.md` untuk migrasi dari SQLite
- Create an issue di repository

Happy coding! 🚀
