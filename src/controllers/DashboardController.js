import Barang from '../models/Barang.js';
import Kategori from '../models/Kategori.js';
import TransaksiMasuk from '../models/TransaksiMasuk.js';
import TransaksiKeluar from '../models/TransaksiKeluar.js';
import { successResponse, errorResponse } from '../utils/response.js';

class DashboardController {
  // Get dashboard stats
  static async getStats(req, res) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      const stats = {
        totalBarang: await Barang.count(),
        totalNilaiInventaris: await Barang.getTotalValue(),
        totalBarangMasuk: await TransaksiMasuk.getTotalByMonth(year, month),
        totalBarangKeluar: await TransaksiKeluar.getTotalByMonth(year, month),
        barangStokRendah: await Barang.count({ stokStatus: 'low' })
      };
      
      return successResponse(res, { stats });
    } catch (error) {
      console.error('Get stats error:', error);
      return errorResponse(res, 'Gagal mengambil statistik dashboard', 500);
    }
  }
  
  // Get chart data (monthly trend)
  static async getChartData(req, res) {
    try {
      const { year = new Date().getFullYear() } = req.query;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      
      const masukTrend = await TransaksiMasuk.getMonthlyTrend(parseInt(year));
      const keluarTrend = await TransaksiKeluar.getMonthlyTrend(parseInt(year));
      
      const chartData = monthNames.map((name, index) => ({
        name,
        masuk: masukTrend[index]?.total || 0,
        keluar: keluarTrend[index]?.total || 0
      }));
      
      return successResponse(res, { chartData });
    } catch (error) {
      console.error('Get chart data error:', error);
      return errorResponse(res, 'Gagal mengambil data chart', 500);
    }
  }
  
  // Get kategori distribution
  static async getKategoriDistribution(req, res) {
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
      console.error('Get kategori distribution error:', error);
      return errorResponse(res, 'Gagal mengambil data distribusi', 500);
    }
  }
  
  // Get low stock items
  static async getLowStockItems(req, res) {
    try {
      const items = await Barang.getLowStockItems();
      return successResponse(res, { items });
    } catch (error) {
      console.error('Get low stock items error:', error);
      return errorResponse(res, 'Gagal mengambil data stok rendah', 500);
    }
  }
  
  // Get top used items
  static async getTopUsedItems(req, res) {
    try {
      const { limit = 8 } = req.query;
      const items = await Barang.getTopUsedItems(parseInt(limit));
      return successResponse(res, { items });
    } catch (error) {
      console.error('Get top used items error:', error);
      return errorResponse(res, 'Gagal mengambil data top pemakaian', 500);
    }
  }
  
  // Get recent activities
  static async getRecentActivities(req, res) {
    try {
      const { limit = 5 } = req.query;
      
      // Get recent transaksi masuk
      const masukList = await TransaksiMasuk.findAll({ limit: parseInt(limit) });
      
      // Get recent transaksi keluar
      const keluarList = await TransaksiKeluar.findAll({ limit: parseInt(limit) });
      
      // Combine and sort
      const activities = [
        ...masukList.map(t => ({
          id: t.id,
          type: 'masuk',
          barang: t.barang.name,
          jumlah: t.jumlah,
          satuan: t.barang.satuan,
          tanggal: t.tanggal
        })),
        ...keluarList.map(t => ({
          id: t.id,
          type: 'keluar',
          barang: t.barang.name,
          jumlah: t.jumlah,
          satuan: t.barang.satuan,
          tanggal: t.tanggal
        }))
      ].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
       .slice(0, parseInt(limit));
      
      return successResponse(res, { activities });
    } catch (error) {
      console.error('Get recent activities error:', error);
      return errorResponse(res, 'Gagal mengambil aktivitas terbaru', 500);
    }
  }
}

export default DashboardController;