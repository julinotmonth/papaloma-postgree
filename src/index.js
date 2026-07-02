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
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if CORS_ORIGIN is '*' (allow all)
    if (config.corsOrigin.includes('*')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (config.corsOrigin.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Also allow any Netlify preview/production subdomain automatically,
    // so a redeploy or renamed Netlify site doesn't break CORS again.
    if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(origin)) {
      return callback(null, true);
    }

    console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

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
let PORT = config.port;

async function startServer(port = PORT) {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    // Create server instance - MUST bind to 0.0.0.0 for Railway
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🍽️  Papaloma Inventory API (PostgreSQL)         ║
║                                                    ║
║   Server running on port: ${port}                     ║
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

    // Handle port already in use error
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${port} is already in use.`);
        const nextPort = port + 1;
        console.log(`🔄 Trying port ${nextPort}...`);
        server.close();
        startServer(nextPort);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production, just log
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;