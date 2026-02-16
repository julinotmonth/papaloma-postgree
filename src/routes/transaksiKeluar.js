import { Router } from 'express';
import TransaksiKeluarController from '../controllers/TransaksiKeluarController.js';
import { authenticate } from '../middleware/auth.js';
import { transaksiKeluarValidation, idParamValidation, paginationValidation } from '../middleware/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', paginationValidation, TransaksiKeluarController.getAll);
router.get('/monthly-trend', TransaksiKeluarController.getMonthlyTrend);
router.get('/total-current-month', TransaksiKeluarController.getTotalCurrentMonth);
router.get('/by-reason', TransaksiKeluarController.getByReason);
router.get('/:id', idParamValidation, TransaksiKeluarController.getById);
router.post('/', transaksiKeluarValidation, TransaksiKeluarController.create);

export default router;
