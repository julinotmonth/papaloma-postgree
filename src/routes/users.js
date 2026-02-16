import { Router } from 'express';
import UserController from '../controllers/UserController.js';
import { authenticate, isSuperAdmin } from '../middleware/auth.js';
import { registerValidation, updateUserValidation, idParamValidation } from '../middleware/validation.js';

const router = Router();

// All routes require authentication and super admin role
router.use(authenticate, isSuperAdmin);

router.get('/', UserController.getAll);
router.get('/:id', idParamValidation, UserController.getById);
router.post('/', registerValidation, UserController.create);
router.put('/:id', idParamValidation, updateUserValidation, UserController.update);
router.delete('/:id', idParamValidation, UserController.delete);
router.post('/:id/reset-password', idParamValidation, UserController.resetPassword);
router.post('/:id/toggle-status', idParamValidation, UserController.toggleStatus);

export default router;
