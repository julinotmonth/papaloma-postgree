import { validationResult } from 'express-validator';
import Barang from '../models/Barang.js';
import Kategori from '../models/Kategori.js';
import ActivityLog from '../models/ActivityLog.js';
import { successResponse, errorResponse, paginatedResponse, validationErrorResponse } from '../utils/response.js';

class BarangController {
  // Get all barang
  static async getAll(req, res) {
    try {
      const { 
        kategoriId, 
        kondisi, 
        stokStatus, 
        search, 
        page = 1, 
        limit = 10 
      } = req.query;
      
      const filters = {
        kategoriId,
        kondisi,
        stokStatus,
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      const barangList = await Barang.findAll(filters);
      const total = await Barang.count(filters);
      
      return paginatedResponse(res, barangList, {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      });
    } catch (error) {
      console.error('Get barang error:', error);
      return errorResponse(res, 'Gagal mengambil data barang', 500);
    }
  }
  
  // Get single barang
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const barang = await Barang.findById(id);
      
      if (!barang) {
        return errorResponse(res, 'Barang tidak ditemukan', 404);
      }
      
      return successResponse(res, { barang });
    } catch (error) {
      console.error('Get barang error:', error);
      return errorResponse(res, 'Gagal mengambil data barang', 500);
    }
  }
  
  // Create barang
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors);
      }
      
      const { 
        name, kategoriId, satuan, stok, stokMinimum, 
        hargaPerUnit, lokasi, kondisi, tanggalKadaluarsa, catatan 
      } = req.body;
      
      // Check if kategori exists
      const kategori = await Kategori.findById(kategoriId);
      if (!kategori) {
        return errorResponse(res, 'Kategori tidak ditemukan', 404);
      }
      
      const barang = await Barang.create({
        name,
        kategoriId,
        satuan,
        stok: stok || 0,
        stokMinimum: stokMinimum || 0,
        hargaPerUnit: hargaPerUnit || 0,
        lokasi,
        kondisi: kondisi || 'baik',
        tanggalKadaluarsa,
        catatan
      });
      
      // Log activity (with null check)
      if (barang && barang.name) {
        await ActivityLog.logBarangCreated(req.user.id, barang);
      }
      
      return successResponse(res, { barang }, 'Barang berhasil ditambahkan', 201);
    } catch (error) {
      console.error('Create barang error:', error);
      return errorResponse(res, 'Gagal menambahkan barang', 500);
    }
  }
  
  // Update barang
  static async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors);
      }
      
      const { id } = req.params;
      
      // Check if barang exists
      const existing = await Barang.findById(id);
      if (!existing) {
        return errorResponse(res, 'Barang tidak ditemukan', 404);
      }
      
      // Check if kategori exists (if updating)
      if (req.body.kategoriId) {
        const kategori = await Kategori.findById(req.body.kategoriId);
        if (!kategori) {
          return errorResponse(res, 'Kategori tidak ditemukan', 404);
        }
      }
      
      const barang = await Barang.update(id, req.body);
      
      // Log activity
      await ActivityLog.logBarangUpdated(req.user.id, barang);
      
      return successResponse(res, { barang }, 'Barang berhasil diperbarui');
    } catch (error) {
      console.error('Update barang error:', error);
      return errorResponse(res, 'Gagal memperbarui barang', 500);
    }
  }
  
  // Delete barang
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const barang = await Barang.findById(id);
      if (!barang) {
        return errorResponse(res, 'Barang tidak ditemukan', 404);
      }
      
      try {
        await Barang.delete(id);
      } catch (err) {
        return errorResponse(res, err.message, 400);
      }
      
      // Log activity
      await ActivityLog.logBarangDeleted(req.user.id, barang.name);
      
      return successResponse(res, null, 'Barang berhasil dihapus');
    } catch (error) {
      console.error('Delete barang error:', error);
      return errorResponse(res, 'Gagal menghapus barang', 500);
    }
  }
  
  // Get low stock items
  static async getLowStock(req, res) {
    try {
      const items = await Barang.getLowStockItems();
      return successResponse(res, { barang: items });
    } catch (error) {
      console.error('Get low stock error:', error);
      return errorResponse(res, 'Gagal mengambil data stok rendah', 500);
    }
  }
  
  // Get damaged items
  static async getDamaged(req, res) {
    try {
      const items = await Barang.getDamagedItems();
      return successResponse(res, { barang: items });
    } catch (error) {
      console.error('Get damaged error:', error);
      return errorResponse(res, 'Gagal mengambil data barang rusak', 500);
    }
  }
  
  // Get top used items
  static async getTopUsed(req, res) {
    try {
      const { limit = 8 } = req.query;
      const items = await Barang.getTopUsedItems(parseInt(limit));
      return successResponse(res, { items });
    } catch (error) {
      console.error('Get top used error:', error);
      return errorResponse(res, 'Gagal mengambil data top pemakaian', 500);
    }
  }
}

export default BarangController;