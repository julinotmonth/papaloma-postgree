import { Router } from 'express';
import TransaksiMasukController from '../controllers/TransaksiMasukController.js';
import { authenticate } from '../middleware/auth.js';
import { transaksiMasukValidation, idParamValidation, paginationValidation } from '../middleware/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', paginationValidation, TransaksiMasukController.getAll);
router.get('/monthly-trend', TransaksiMasukController.getMonthlyTrend);
router.get('/total-current-month', TransaksiMasukController.getTotalCurrentMonth);
router.get('/:id', idParamValidation, TransaksiMasukController.getById);
router.post('/', transaksiMasukValidation, TransaksiMasukController.create);

export default router;
