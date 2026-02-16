import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { successResponse, errorResponse, paginatedResponse, validationErrorResponse } from '../utils/response.js';

class UserController {
  // Get all users
  static async getAll(req, res) {
    try {
      const { status, role, search, page = 1, limit = 10 } = req.query;
      
      const filters = { status, role, search };
      const users = await User.findAll(filters);
      const total = await User.count(filters);
      
      return paginatedResponse(res, users, {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      });
    } catch (error) {
      console.error('Get users error:', error);
      return errorResponse(res, 'Gagal mengambil data users', 500);
    }
  }
  
  // Get single user
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return errorResponse(res, 'User tidak ditemukan', 404);
      }
      
      return successResponse(res, { user });
    } catch (error) {
      console.error('Get user error:', error);
      return errorResponse(res, 'Gagal mengambil data user', 500);
    }
  }
  
  // Create user (Super Admin only)
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors);
      }
      
      const { name, email, password, role, status } = req.body;
      
      // Check if email exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return errorResponse(res, 'Email sudah digunakan', 409);
      }
      
      const user = await User.create({
        name,
        email,
        password,
        role: role || 'admin',
        status: status || 'active'
      });
      
      return successResponse(res, { user }, 'User berhasil ditambahkan', 201);
    } catch (error) {
      console.error('Create user error:', error);
      return errorResponse(res, 'Gagal menambahkan user', 500);
    }
  }
  
  // Update user
  static async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors);
      }
      
      const { id } = req.params;
      const { name, email, role, status } = req.body;
      
      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return errorResponse(res, 'User tidak ditemukan', 404);
      }
      
      // Check if email already exists (for other users)
      if (email) {
        const emailUser = await User.findByEmail(email);
        if (emailUser && emailUser.id !== parseInt(id)) {
          return errorResponse(res, 'Email sudah digunakan', 409);
        }
      }
      
      // Prevent self-demotion from super_admin
      if (parseInt(id) === req.user.id && role && role !== req.user.role) {
        return errorResponse(res, 'Tidak dapat mengubah role sendiri', 400);
      }
      
      // Prevent deactivating self
      if (parseInt(id) === req.user.id && status === 'inactive') {
        return errorResponse(res, 'Tidak dapat menonaktifkan akun sendiri', 400);
      }
      
      const user = await User.update(id, { name, email, role, status });
      
      return successResponse(res, { user }, 'User berhasil diperbarui');
    } catch (error) {
      console.error('Update user error:', error);
      return errorResponse(res, 'Gagal memperbarui user', 500);
    }
  }
  
  // Delete user
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Prevent self-deletion
      if (parseInt(id) === req.user.id) {
        return errorResponse(res, 'Tidak dapat menghapus akun sendiri', 400);
      }
      
      const user = await User.findById(id);
      if (!user) {
        return errorResponse(res, 'User tidak ditemukan', 404);
      }
      
      await User.delete(id);
      
      return successResponse(res, null, 'User berhasil dihapus');
    } catch (error) {
      console.error('Delete user error:', error);
      return errorResponse(res, 'Gagal menghapus user', 500);
    }
  }
  
  // Reset password (Super Admin only)
  static async resetPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return errorResponse(res, 'Password minimal 6 karakter', 400);
      }
      
      const user = await User.findById(id);
      if (!user) {
        return errorResponse(res, 'User tidak ditemukan', 404);
      }
      
      await User.updatePassword(id, newPassword);
      
      return successResponse(res, null, 'Password berhasil direset');
    } catch (error) {
      console.error('Reset password error:', error);
      return errorResponse(res, 'Gagal mereset password', 500);
    }
  }
  
  // Toggle user status
  static async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      
      // Prevent self-toggle
      if (parseInt(id) === req.user.id) {
        return errorResponse(res, 'Tidak dapat mengubah status akun sendiri', 400);
      }
      
      const user = await User.findById(id);
      if (!user) {
        return errorResponse(res, 'User tidak ditemukan', 404);
      }
      
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const updatedUser = await User.update(id, { status: newStatus });
      
      return successResponse(res, { user: updatedUser }, `User berhasil ${newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error) {
      console.error('Toggle status error:', error);
      return errorResponse(res, 'Gagal mengubah status user', 500);
    }
  }
}

export default UserController;