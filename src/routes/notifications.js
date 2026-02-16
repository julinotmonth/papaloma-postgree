import { Router } from 'express';
import NotificationController from '../controllers/NotificationController.js';
import { authenticate } from '../middleware/auth.js';
import { idParamValidation, paginationValidation } from '../middleware/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', paginationValidation, NotificationController.getAll);
router.get('/unread-count', NotificationController.getUnreadCount);
router.put('/:id/read', idParamValidation, NotificationController.markAsRead);
router.put('/read-all', NotificationController.markAllAsRead);
router.delete('/:id', idParamValidation, NotificationController.delete);
router.delete('/', NotificationController.deleteAll);

export default router;
