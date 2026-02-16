import { Router } from 'express';
import AuthController from '../controllers/AuthController.js';
import { authenticate } from '../middleware/auth.js';
import { loginValidation, changePasswordValidation, updateUserValidation } from '../middleware/validation.js';

const router = Router();

// Public routes
router.post('/login', loginValidation, AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.get('/verify-reset-token/:token', AuthController.verifyResetToken);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes
router.get('/me', authenticate, AuthController.me);
router.post('/logout', authenticate, AuthController.logout);
router.put('/profile', authenticate, updateUserValidation, AuthController.updateProfile);
router.put('/change-password', authenticate, changePasswordValidation, AuthController.changePassword);

export default router;