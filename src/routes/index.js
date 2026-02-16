import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import kategoriRoutes from './kategori.js';
import barangRoutes from './barang.js';
import transaksiMasukRoutes from './transaksiMasuk.js';
import transaksiKeluarRoutes from './transaksiKeluar.js';
import dashboardRoutes from './dashboard.js';
import notificationRoutes from './notifications.js';
import activityLogRoutes from './activityLogs.js';
import laporanRoutes from './laporan.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Papaloma API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/kategori', kategoriRoutes);
router.use('/barang', barangRoutes);
router.use('/transaksi-masuk', transaksiMasukRoutes);
router.use('/transaksi-keluar', transaksiKeluarRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activity-logs', activityLogRoutes);
router.use('/laporan', laporanRoutes);

export default router;
