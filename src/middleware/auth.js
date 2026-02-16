import { verifyToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/response.js';
import User from '../models/User.js';

// Authenticate JWT token
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Token tidak ditemukan', 401);
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return errorResponse(res, 'Token tidak valid atau sudah expired', 401);
    }
    
    // Get user from database (FIXED: added await)
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 401);
    }
    
    if (user.status !== 'active') {
      return errorResponse(res, 'Akun tidak aktif', 403);
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return errorResponse(res, 'Authentication error', 401);
  }
};

// Check if user is super admin
export const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return errorResponse(res, 'Akses ditolak. Hanya Super Admin yang diizinkan.', 403);
  }
  next();
};

// Check if user is admin or super admin
export const isAdmin = (req, res, next) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return errorResponse(res, 'Akses ditolak. Hanya Admin yang diizinkan.', 403);
  }
  next();
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      
      if (decoded) {
        const user = await User.findById(decoded.id);
        if (user && user.status === 'active') {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};