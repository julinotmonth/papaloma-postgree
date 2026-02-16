import { Router } from 'express';
import DashboardController from '../controllers/DashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/stats', DashboardController.getStats);
router.get('/chart-data', DashboardController.getChartData);
router.get('/kategori-distribution', DashboardController.getKategoriDistribution);
router.get('/low-stock', DashboardController.getLowStockItems);
router.get('/top-used', DashboardController.getTopUsedItems);
router.get('/recent-activities', DashboardController.getRecentActivities);

export default router;
