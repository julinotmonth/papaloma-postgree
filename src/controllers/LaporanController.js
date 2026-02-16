import Barang from '../models/Barang.js';
import Kategori from '../models/Kategori.js';
import TransaksiMasuk from '../models/TransaksiMasuk.js';
import TransaksiKeluar from '../models/TransaksiKeluar.js';
import { successResponse, errorResponse } from '../utils/response.js';

class LaporanController {
  // Get stock report
  static async getStokReport(req, res) {
    try {
      const { kategoriId } = req.query;
      
      const filters = kategoriId ? { kategoriId } : {};
      const barangList = await Barang.findAll({ ...filters, limit: 1000 });
      
      const totalNilai = barangList.reduce((acc, b) => acc + (b.stok * b.hargaPerUnit), 0);
      
      const report = {
        items: barangList.map(item => ({
          ...item,
          totalNilai: item.stok * item.hargaPerUnit,
          status: item.stok <= 0 ? 'habis' : item.stok <= item.stokMinimum ? 'menipis' : 'aman'
        })),
        summary: {
          totalItems: barangList.length,
          totalNilai,
          lowStockCount: barangList.filter(b => b.stok <= b.stokMinimum).length
        }
      };
      
      return successResponse(res, { report });
    } catch (error) {
      console.error('Get stok report error:', error);
      return errorResponse(res, 'Gagal mengambil laporan stok', 500);
    }
  }
  
  // Get barang masuk report
  static async getMasukReport(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;
      
      const transaksiList = await TransaksiMasuk.findAll({
        dateFrom,
        dateTo,
        limit: 1000
      });
      
      const totalJumlah = transaksiList.reduce((acc, t) => acc + t.jumlah, 0);
      
      const report = {
        items: transaksiList,
        summary: {
          totalTransaksi: transaksiList.length,
          totalJumlah
        }
      };
      
      return successResponse(res, { report });
    } catch (error) {
      console.error('Get masuk report error:', error);
      return errorResponse(res, 'Gagal mengambil laporan barang masuk', 500);
    }
  }
  
  // Get barang keluar report
  static async getKeluarReport(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;
      
      const transaksiList = await TransaksiKeluar.findAll({
        dateFrom,
        dateTo,
        limit: 1000
      });
      
      const totalJumlah = transaksiList.reduce((acc, t) => acc + t.jumlah, 0);
      const byReason = await TransaksiKeluar.getByReason(dateFrom, dateTo);
      
      const report = {
        items: transaksiList,
        summary: {
          totalTransaksi: transaksiList.length,
          totalJumlah,
          byReason
        }
      };
      
      return successResponse(res, { report });
    } catch (error) {
      console.error('Get keluar report error:', error);
      return errorResponse(res, 'Gagal mengambil laporan barang keluar', 500);
    }
  }
  
  // Get penyusutan (damaged/expired) report
  static async getPenyusutanReport(req, res) {
    try {
      const damagedItems = await Barang.getDamagedItems();
      
      const totalKerugian = damagedItems.reduce(
        (acc, b) => acc + (b.stok * b.hargaPerUnit), 
        0
      );
      
      const report = {
        items: damagedItems.map(item => ({
          ...item,
          estimasiKerugian: item.stok * item.hargaPerUnit
        })),
        summary: {
          totalItems: damagedItems.length,
          totalKerugian,
          byKondisi: {
            rusak: damagedItems.filter(b => b.kondisi === 'rusak').length,
            kadaluarsa: damagedItems.filter(b => b.kondisi === 'kadaluarsa').length
          }
        }
      };
      
      return successResponse(res, { report });
    } catch (error) {
      console.error('Get penyusutan report error:', error);
      return errorResponse(res, 'Gagal mengambil laporan penyusutan', 500);
    }
  }
  
  // Get comprehensive report
  static async getComprehensiveReport(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;
      const now = new Date();
      
      // Stock summary
      const barangList = await Barang.findAll({ limit: 1000 });
      const totalNilai = barangList.reduce((acc, b) => acc + (b.stok * b.hargaPerUnit), 0);
      
      // Transaction summary
      const masukList = await TransaksiMasuk.findAll({ dateFrom, dateTo, limit: 1000 });
      const keluarList = await TransaksiKeluar.findAll({ dateFrom, dateTo, limit: 1000 });
      
      // Damaged items
      const damagedItems = await Barang.getDamagedItems();
      const totalKerugian = damagedItems.reduce((acc, b) => acc + (b.stok * b.hargaPerUnit), 0);
      
      const report = {
        generatedAt: now.toISOString(),
        period: { dateFrom, dateTo },
        stok: {
          totalItems: barangList.length,
          totalNilai,
          lowStock: barangList.filter(b => b.stok <= b.stokMinimum).length
        },
        barangMasuk: {
          totalTransaksi: masukList.length,
          totalJumlah: masukList.reduce((acc, t) => acc + t.jumlah, 0)
        },
        barangKeluar: {
          totalTransaksi: keluarList.length,
          totalJumlah: keluarList.reduce((acc, t) => acc + t.jumlah, 0)
        },
        penyusutan: {
          totalItems: damagedItems.length,
          totalKerugian
        }
      };
      
      return successResponse(res, { report });
    } catch (error) {
      console.error('Get comprehensive report error:', error);
      return errorResponse(res, 'Gagal mengambil laporan', 500);
    }
  }
}

export default LaporanController;