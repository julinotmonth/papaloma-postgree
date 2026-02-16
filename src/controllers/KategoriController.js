import { validationResult } from 'express-validator';
import Kategori from '../models/Kategori.js';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/response.js';

class KategoriController {
  // Get all kategori
  static async getAll(req, res) {
    try {
      const kategoriList = await Kategori.findAll();
      return successResponse(res, { kategori: kategoriList });
    } catch (error) {
      console.error('Get kategori error:', error);
      return errorResponse(res, 'Gagal mengambil data kategori', 500);
    }
  }
  
  // Get single kategori
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const kategori = await Kategori.findById(id);
      
      if (!kategori) {
        return errorResponse(res, 'Kategori tidak ditemukan', 404);
      }
      
      return successResponse(res, { kategori });
    } catch (error) {
      console.error('Get kategori error:', error);
      return errorResponse(res, 'Gagal mengambil data kategori', 500);
    }
  }
  
  // Create kategori
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors);
      }
      
      const { name, description } = req.body;
      
      // Check if name exists
      const existing = await Kategori.findByName(name);
      if (existing) {
        return errorResponse(res, 'Nama kategori sudah ada', 409);
      }
      
      const kategori = await Kategori.create({ name, description });
      
      return successResponse(res, { kategori }, 'Kategori berhasil ditambahkan', 201);
    } catch (error) {
      console.error('Create kategori error:', error);
      return errorResponse(res, 'Gagal menambahkan kategori', 500);
    }
  }
  
  // Update kategori
  static async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors);
      }
      
      const { id } = req.params;
      const { name, description } = req.body;
      
      // Check if kategori exists
      const existing = await Kategori.findById(id);
      if (!existing) {
        return errorResponse(res, 'Kategori tidak ditemukan', 404);
      }
      
      // Check if name already exists (for other kategori)
      if (name) {
        const nameExists = await Kategori.findByName(name);
        if (nameExists && nameExists.id !== parseInt(id)) {
          return errorResponse(res, 'Nama kategori sudah ada', 409);
        }
      }
      
      const kategori = await Kategori.update(id, { name, description });
      
      return successResponse(res, { kategori }, 'Kategori berhasil diperbarui');
    } catch (error) {
      console.error('Update kategori error:', error);
      return errorResponse(res, 'Gagal memperbarui kategori', 500);
    }
  }
  
  // Delete kategori
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const kategori = await Kategori.findById(id);
      if (!kategori) {
        return errorResponse(res, 'Kategori tidak ditemukan', 404);
      }
      
      try {
        await Kategori.delete(id);
      } catch (err) {
        return errorResponse(res, err.message, 400);
      }
      
      return successResponse(res, null, 'Kategori berhasil dihapus');
    } catch (error) {
      console.error('Delete kategori error:', error);
      return errorResponse(res, 'Gagal menghapus kategori', 500);
    }
  }
  
  // Get kategori distribution
  static async getDistribution(req, res) {
    try {
      const distribution = await Kategori.getDistribution();
      
      // Add colors
      const colors = {
        'Daging & Unggas': '#ef4444',
        'Sayuran': '#22c55e',
        'Bumbu Dapur': '#f97316',
        'Dairy & Telur': '#3b82f6',
        'Kering & Tepung': '#eab308',
        'Minuman': '#06b6d4',
        'Minyak & Saus': '#8b5cf6',
      };
      
      const result = distribution.map(item => ({
        name: item.name,
        value: item.value,
        color: colors[item.name] || '#94a3b8'
      }));
      
      return successResponse(res, { distribution: result });
    } catch (error) {
      console.error('Get distribution error:', error);
      return errorResponse(res, 'Gagal mengambil data distribusi', 500);
    }
  }
}

export default KategoriController;