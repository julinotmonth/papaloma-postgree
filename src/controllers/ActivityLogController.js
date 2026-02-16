import ActivityLog from '../models/ActivityLog.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';

class ActivityLogController {
  // Get all activity logs
  static async getAll(req, res) {
    try {
      const { userId, entityType, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
      
      const filters = {
        userId,
        entityType,
        dateFrom,
        dateTo,
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      const logs = await ActivityLog.findAll(filters);
      const total = await ActivityLog.count(filters);
      
      return paginatedResponse(res, logs, {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      });
    } catch (error) {
      console.error('Get activity logs error:', error);
      return errorResponse(res, 'Gagal mengambil log aktivitas', 500);
    }
  }
  
  // Get current user's activity logs
  static async getMyLogs(req, res) {
    try {
      const { limit = 10 } = req.query;
      const logs = await ActivityLog.findByUser(req.user.id, parseInt(limit));
      return successResponse(res, { logs });
    } catch (error) {
      console.error('Get my logs error:', error);
      return errorResponse(res, 'Gagal mengambil log aktivitas', 500);
    }
  }
}

export default ActivityLogController;