import { Router } from 'express';
import ActivityLogController from '../controllers/ActivityLogController.js';
import { authenticate, isSuperAdmin } from '../middleware/auth.js';
import { paginationValidation } from '../middleware/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user's activity logs
router.get('/me', ActivityLogController.getMyLogs);

// Get all logs (super admin only)
router.get('/', isSuperAdmin, paginationValidation, ActivityLogController.getAll);

export default router;
