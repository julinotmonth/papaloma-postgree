import { Router } from 'express';
import LaporanController from '../controllers/LaporanController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/stok', LaporanController.getStokReport);
router.get('/masuk', LaporanController.getMasukReport);
router.get('/keluar', LaporanController.getKeluarReport);
router.get('/penyusutan', LaporanController.getPenyusutanReport);
router.get('/comprehensive', LaporanController.getComprehensiveReport);

export default router;
