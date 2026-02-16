import { validationResult } from 'express-validator';
import crypto from 'crypto';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { generateToken } from '../utils/jwt.js';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/response.js';

// Store reset tokens in memory (in production, use database or Redis)
const resetTokens = new Map();

class AuthController {
  // Login
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors);
      }
      
      const { email, password } = req.body;
      
      // Find user - ADD AWAIT
      const user = await User.findByEmail(email);
      if (!user) {
        return errorResponse(res, 'Email atau password salah', 401);
      }
      
      // Check password
      if (!User.verifyPassword(password, user.password)) {
        return errorResponse(res, 'Email atau password salah', 401);
      }
      
      // Check status
      if (user.status !== 'active') {
        return errorResponse(res, 'Akun tidak aktif', 403);
      }
      
      // Update last login - ADD AWAIT
      await User.updateLastLogin(user.id);
      
      // Log activity - ADD AWAIT
      await ActivityLog.create({
        userId: user.id,
        action: 'Login',
        entityType: 'user',
        entityId: user.id
      });
      
      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });
      
      // Get updated user data - ADD AWAIT
      const userData = await User.findById(user.id);
      
      return successResponse(res, {
        user: userData,
        token
      }, 'Login berhasil');
    } catch (error) {
      console.error('Login error:', error);
      return errorResponse(res, 'Login gagal', 500);
    }
  }
  
  // Get current user
  static async me(req, res) {
    try {
      const user = await User.findById(req.user.id);
      return successResponse(res, { user });
    } catch (error) {
      console.error('Get user error:', error);
      return errorResponse(res, 'Gagal mengambil data user', 500);
    }
  }
  
  // Logout (optional - mainly for logging)
  static async logout(req, res) {
    try {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'Logout',
        entityType: 'user',
        entityId: req.user.id
      });
      return successResponse(res, null, 'Logout berhasil');
    } catch (error) {
      console.error('Logout error:', error);
      return errorResponse(res, 'Logout gagal', 500);
    }
  }
  
  // Update profile
  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors);
      }
      
      const { name, email } = req.body;
      
      // Check if email already exists (for other users) - ADD AWAIT
      if (email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser.id !== req.user.id) {
          return errorResponse(res, 'Email sudah digunakan', 409);
        }
      }
      
      const updatedUser = await User.update(req.user.id, { name, email });
      
      return successResponse(res, { user: updatedUser }, 'Profil berhasil diperbarui');
    } catch (error) {
      console.error('Update profile error:', error);
      return errorResponse(res, 'Gagal memperbarui profil', 500);
    }
  }
  
  // Change password
  static async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors);
      }
      
      const { currentPassword, newPassword } = req.body;
      
      // Get user with password - ADD AWAIT
      const user = await User.findByEmail(req.user.email);
      
      // Verify current password
      if (!User.verifyPassword(currentPassword, user.password)) {
        return errorResponse(res, 'Password saat ini salah', 400);
      }
      
      // Update password - ADD AWAIT
      await User.updatePassword(req.user.id, newPassword);
      
      return successResponse(res, null, 'Password berhasil diubah');
    } catch (error) {
      console.error('Change password error:', error);
      return errorResponse(res, 'Gagal mengubah password', 500);
    }
  }
  
  // Forgot password - request reset token
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return errorResponse(res, 'Email harus diisi', 400);
      }
      
      // Find user - ADD AWAIT
      const user = await User.findByEmail(email);
      if (!user) {
        // Return success even if email not found (security best practice)
        return successResponse(res, { 
          message: 'Jika email terdaftar, instruksi reset password akan dikirim'
        }, 'Request reset password berhasil');
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 3600000; // 1 hour
      
      // Store token
      resetTokens.set(resetToken, {
        userId: user.id,
        email: user.email,
        expiresAt
      });
      
      // In production, send email with reset link
      // For demo, we return the token directly
      console.log(`Reset token for ${email}: ${resetToken}`);
      
      return successResponse(res, { 
        message: 'Jika email terdaftar, instruksi reset password akan dikirim',
        // Only for demo - remove in production
        resetToken: resetToken,
        resetUrl: `http://localhost:5173/reset-password?token=${resetToken}`
      }, 'Request reset password berhasil');
    } catch (error) {
      console.error('Forgot password error:', error);
      return errorResponse(res, 'Gagal memproses permintaan', 500);
    }
  }
  
  // Verify reset token
  static async verifyResetToken(req, res) {
    try {
      const { token } = req.params;
      
      const tokenData = resetTokens.get(token);
      
      if (!tokenData) {
        return errorResponse(res, 'Token tidak valid', 400);
      }
      
      if (Date.now() > tokenData.expiresAt) {
        resetTokens.delete(token);
        return errorResponse(res, 'Token sudah kadaluarsa', 400);
      }
      
      return successResponse(res, { 
        valid: true,
        email: tokenData.email 
      }, 'Token valid');
    } catch (error) {
      console.error('Verify token error:', error);
      return errorResponse(res, 'Gagal memverifikasi token', 500);
    }
  }
  
  // Reset password with token
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return errorResponse(res, 'Token dan password baru harus diisi', 400);
      }
      
      if (newPassword.length < 6) {
        return errorResponse(res, 'Password minimal 6 karakter', 400);
      }
      
      const tokenData = resetTokens.get(token);
      
      if (!tokenData) {
        return errorResponse(res, 'Token tidak valid', 400);
      }
      
      if (Date.now() > tokenData.expiresAt) {
        resetTokens.delete(token);
        return errorResponse(res, 'Token sudah kadaluarsa', 400);
      }
      
      // Update password - ADD AWAIT
      await User.updatePassword(tokenData.userId, newPassword);
      
      // Delete used token
      resetTokens.delete(token);
      
      return successResponse(res, null, 'Password berhasil direset');
    } catch (error) {
      console.error('Reset password error:', error);
      return errorResponse(res, 'Gagal mereset password', 500);
    }
  }
}

export default AuthController;
