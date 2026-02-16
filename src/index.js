import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config/index.js';
import { initializeDatabase } from './database/db.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (for uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Papaloma Inventory API (PostgreSQL)',
    version: '1.0.0',
    database: 'PostgreSQL',
    documentation: '/api/health'
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.port;

async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🍽️  Papaloma Inventory API (PostgreSQL)         ║
║                                                    ║
║   Server running on: http://localhost:${PORT}         ║
║   Environment: ${config.nodeEnv.padEnd(30)}   ║
║   Database: PostgreSQL                             ║
║                                                    ║
║   API Endpoints:                                   ║
║   • POST   /api/auth/login                         ║
║   • GET    /api/dashboard/stats                    ║
║   • GET    /api/barang                             ║
║   • POST   /api/transaksi-masuk                    ║
║   • POST   /api/transaksi-keluar                   ║
║   • GET    /api/laporan/stok                       ║
║                                                    ║
╚════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
