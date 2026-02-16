import { Router } from 'express';
import BarangController from '../controllers/BarangController.js';
import { authenticate } from '../middleware/auth.js';
import { barangValidation, updateBarangValidation, idParamValidation, paginationValidation } from '../middleware/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', paginationValidation, BarangController.getAll);
router.get('/low-stock', BarangController.getLowStock);
router.get('/damaged', BarangController.getDamaged);
router.get('/top-used', BarangController.getTopUsed);
router.get('/:id', idParamValidation, BarangController.getById);
router.post('/', barangValidation, BarangController.create);
router.put('/:id', idParamValidation, updateBarangValidation, BarangController.update);
router.delete('/:id', idParamValidation, BarangController.delete);

export default router;
