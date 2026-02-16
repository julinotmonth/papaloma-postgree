import { validationResult } from 'express-validator';
import TransaksiMasuk from '../models/TransaksiMasuk.js';
import Barang from '../models/Barang.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import { successResponse, errorResponse, paginatedResponse, validationErrorResponse } from '../utils/response.js';

class TransaksiMasukController {
  // Get all transaksi masuk
  static async getAll(req, res) {
    try {
      const { 
        barangId, 
        dateFrom, 
        dateTo, 
        search,
        page = 1, 
        limit = 10 
      } = req.query;
      
      const filters = {
        barangId,
        dateFrom,
        dateTo,
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      const transaksiList = await TransaksiMasuk.findAll(filters);
      const total = await TransaksiMasuk.count(filters);
      
      return paginatedResponse(res, transaksiList, {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      });
    } catch (error) {
      console.error('Get transaksi masuk error:', error);
      return errorResponse(res, 'Gagal mengambil data transaksi masuk', 500);
    }
  }
  
  // Get single transaksi masuk
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const transaksi = await TransaksiMasuk.findById(id);
      
      if (!transaksi) {
        return errorResponse(res, 'Transaksi tidak ditemukan', 404);
      }
      
      return successResponse(res, { transaksi });
    } catch (error) {
      console.error('Get transaksi masuk error:', error);
      return errorResponse(res, 'Gagal mengambil data transaksi', 500);
    }
  }
  
  // Create transaksi masuk
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors);
      }
      
      const { barangId, jumlah, tanggal, supplier, catatan } = req.body;
      
      // Check if barang exists
      const barang = await Barang.findById(barangId);
      if (!barang) {
        return errorResponse(res, 'Barang tidak ditemukan', 404);
      }
      
      const transaksi = await TransaksiMasuk.create({
        barangId,
        jumlah,
        tanggal,
        supplier,
        catatan
      }, req.user.id);
      
      // Log activity
      await ActivityLog.logTransaksiMasuk(req.user.id, barang, jumlah);
      
      // Create notification
      await Notification.createTransactionNotification('masuk', barang, jumlah, req.user.name);
      
      return successResponse(res, { transaksi }, `${jumlah} ${barang.satuan} ${barang.name} berhasil ditambahkan`, 201);
    } catch (error) {
      console.error('Create transaksi masuk error:', error);
      return errorResponse(res, error.message || 'Gagal mencatat barang masuk', 500);
    }
  }
  
  // Get monthly trend
  static async getMonthlyTrend(req, res) {
    try {
      const { year = new Date().getFullYear() } = req.query;
      const trend = await TransaksiMasuk.getMonthlyTrend(parseInt(year));
      return successResponse(res, { trend });
    } catch (error) {
      console.error('Get monthly trend error:', error);
      return errorResponse(res, 'Gagal mengambil data trend', 500);
    }
  }
  
  // Get total by current month
  static async getTotalCurrentMonth(req, res) {
    try {
      const now = new Date();
      const total = await TransaksiMasuk.getTotalByMonth(now.getFullYear(), now.getMonth() + 1);
      return successResponse(res, { total });
    } catch (error) {
      console.error('Get total current month error:', error);
      return errorResponse(res, 'Gagal mengambil data total', 500);
    }
  }
}

export default TransaksiMasukController;