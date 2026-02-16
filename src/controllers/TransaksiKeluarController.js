import { validationResult } from 'express-validator';
import TransaksiKeluar from '../models/TransaksiKeluar.js';
import Barang from '../models/Barang.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import { successResponse, errorResponse, paginatedResponse, validationErrorResponse } from '../utils/response.js';

class TransaksiKeluarController {
  // Get all transaksi keluar
  static async getAll(req, res) {
    try {
      const { 
        barangId, 
        alasan,
        dateFrom, 
        dateTo, 
        search,
        page = 1, 
        limit = 10 
      } = req.query;
      
      const filters = {
        barangId,
        alasan,
        dateFrom,
        dateTo,
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      const transaksiList = await TransaksiKeluar.findAll(filters);
      const total = await TransaksiKeluar.count(filters);
      
      return paginatedResponse(res, transaksiList, {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      });
    } catch (error) {
      console.error('Get transaksi keluar error:', error);
      return errorResponse(res, 'Gagal mengambil data transaksi keluar', 500);
    }
  }
  
  // Get single transaksi keluar
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const transaksi = await TransaksiKeluar.findById(id);
      
      if (!transaksi) {
        return errorResponse(res, 'Transaksi tidak ditemukan', 404);
      }
      
      return successResponse(res, { transaksi });
    } catch (error) {
      console.error('Get transaksi keluar error:', error);
      return errorResponse(res, 'Gagal mengambil data transaksi', 500);
    }
  }
  
  // Create transaksi keluar
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors);
      }
      
      const { barangId, jumlah, tanggal, alasan, catatan } = req.body;
      
      // Check if barang exists
      const barang = await Barang.findById(barangId);
      if (!barang) {
        return errorResponse(res, 'Barang tidak ditemukan', 404);
      }
      
      // Check stock
      if (barang.stok < jumlah) {
        return errorResponse(res, 'Stok tidak mencukupi', 400);
      }
      
      const transaksi = await TransaksiKeluar.create({
        barangId,
        jumlah,
        tanggal,
        alasan,
        catatan
      }, req.user.id);
      
      // Log activity
      await ActivityLog.logTransaksiKeluar(req.user.id, barang, jumlah);
      
      // Create notification
      await Notification.createTransactionNotification('keluar', barang, jumlah, req.user.name);
      
      // Check if stock is now low
      const updatedBarang = await Barang.findById(barangId);
      if (updatedBarang.stok <= updatedBarang.stokMinimum) {
        await Notification.createLowStockNotification(updatedBarang);
      }
      
      return successResponse(res, { transaksi }, `${jumlah} ${barang.satuan} ${barang.name} berhasil dikeluarkan`, 201);
    } catch (error) {
      console.error('Create transaksi keluar error:', error);
      return errorResponse(res, error.message || 'Gagal mencatat barang keluar', 500);
    }
  }
  
  // Get monthly trend
  static async getMonthlyTrend(req, res) {
    try {
      const { year = new Date().getFullYear() } = req.query;
      const trend = await TransaksiKeluar.getMonthlyTrend(parseInt(year));
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
      const total = await TransaksiKeluar.getTotalByMonth(now.getFullYear(), now.getMonth() + 1);
      return successResponse(res, { total });
    } catch (error) {
      console.error('Get total current month error:', error);
      return errorResponse(res, 'Gagal mengambil data total', 500);
    }
  }
  
  // Get by reason
  static async getByReason(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;
      const data = await TransaksiKeluar.getByReason(dateFrom, dateTo);
      return successResponse(res, { data });
    } catch (error) {
      console.error('Get by reason error:', error);
      return errorResponse(res, 'Gagal mengambil data', 500);
    }
  }
}

export default TransaksiKeluarController;