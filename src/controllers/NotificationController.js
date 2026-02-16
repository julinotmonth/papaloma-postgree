import Notification from '../models/Notification.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';

class NotificationController {
  // Get all notifications
  static async getAll(req, res) {
    try {
      const { read, type, page = 1, limit = 20 } = req.query;
      
      const filters = {
        read: read !== undefined ? read === 'true' : undefined,
        type,
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      const notifications = await Notification.findAll(req.user.id, filters);
      const total = await Notification.countAll(req.user.id, filters);
      
      return paginatedResponse(res, notifications, {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      return errorResponse(res, 'Gagal mengambil notifikasi', 500);
    }
  }
  
  // Get unread count
  static async getUnreadCount(req, res) {
    try {
      const count = await Notification.getUnreadCount(req.user.id);
      return successResponse(res, { count });
    } catch (error) {
      console.error('Get unread count error:', error);
      return errorResponse(res, 'Gagal mengambil jumlah notifikasi', 500);
    }
  }
  
  // Mark as read
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      
      const notification = await Notification.findById(id);
      if (!notification) {
        return errorResponse(res, 'Notifikasi tidak ditemukan', 404);
      }
      
      await Notification.markAsRead(id);
      
      return successResponse(res, null, 'Notifikasi ditandai sudah dibaca');
    } catch (error) {
      console.error('Mark as read error:', error);
      return errorResponse(res, 'Gagal menandai notifikasi', 500);
    }
  }
  
  // Mark all as read
  static async markAllAsRead(req, res) {
    try {
      await Notification.markAllAsRead(req.user.id);
      return successResponse(res, null, 'Semua notifikasi ditandai sudah dibaca');
    } catch (error) {
      console.error('Mark all as read error:', error);
      return errorResponse(res, 'Gagal menandai notifikasi', 500);
    }
  }
  
  // Delete notification
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const notification = await Notification.findById(id);
      if (!notification) {
        return errorResponse(res, 'Notifikasi tidak ditemukan', 404);
      }
      
      await Notification.delete(id);
      
      return successResponse(res, null, 'Notifikasi berhasil dihapus');
    } catch (error) {
      console.error('Delete notification error:', error);
      return errorResponse(res, 'Gagal menghapus notifikasi', 500);
    }
  }
  
  // Delete all notifications
  static async deleteAll(req, res) {
    try {
      await Notification.deleteAll(req.user.id);
      return successResponse(res, null, 'Semua notifikasi berhasil dihapus');
    } catch (error) {
      console.error('Delete all notifications error:', error);
      return errorResponse(res, 'Gagal menghapus notifikasi', 500);
    }
  }
}

export default NotificationController;