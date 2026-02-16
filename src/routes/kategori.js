import { Router } from 'express';
import KategoriController from '../controllers/KategoriController.js';
import { authenticate } from '../middleware/auth.js';
import { kategoriValidation, idParamValidation } from '../middleware/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', KategoriController.getAll);
router.get('/distribution', KategoriController.getDistribution);
router.get('/:id', idParamValidation, KategoriController.getById);
router.post('/', kategoriValidation, KategoriController.create);
router.put('/:id', idParamValidation, kategoriValidation, KategoriController.update);
router.delete('/:id', idParamValidation, KategoriController.delete);

export default router;
