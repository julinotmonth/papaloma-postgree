import { query, getClient } from '../database/db.js';
import Barang from './Barang.js';

class TransaksiKeluar {
  static async findAll(filters = {}) {
    let sql = `
      SELECT tk.*, 
        b.name as barang_name, b.satuan as barang_satuan,
        u.name as created_by_name
      FROM transaksi_keluar tk
      LEFT JOIN barang b ON tk.barang_id = b.id
      LEFT JOIN users u ON tk.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    if (filters.barangId) {
      paramCount++;
      sql += ` AND tk.barang_id = $${paramCount}`;
      params.push(filters.barangId);
    }
    
    if (filters.alasan) {
      paramCount++;
      sql += ` AND tk.alasan = $${paramCount}`;
      params.push(filters.alasan);
    }
    
    if (filters.startDate) {
      paramCount++;
      sql += ` AND tk.tanggal >= $${paramCount}`;
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      paramCount++;
      sql += ` AND tk.tanggal <= $${paramCount}`;
      params.push(filters.endDate);
    }
    
    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    
    sql += ' ORDER BY tk.created_at DESC';
    
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await query(sql, params);
    return result.rows.map(item => this.formatTransaksi(item));
  }
  
  static async findById(id) {
    const result = await query(`
      SELECT tk.*, 
        b.name as barang_name, b.satuan as barang_satuan,
        u.name as created_by_name
      FROM transaksi_keluar tk
      JOIN barang b ON tk.barang_id = b.id
      JOIN users u ON tk.created_by = u.id
      WHERE tk.id = $1
    `, [id]);
    
    return result.rows[0] ? this.formatTransaksi(result.rows[0]) : null;
  }
  
  static async create(data, userId) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Check stok
      const barangResult = await client.query(
        'SELECT stok FROM barang WHERE id = $1',
        [data.barangId]
      );
      
      if (!barangResult.rows[0]) {
        throw new Error('Barang tidak ditemukan');
      }
      
      const currentStok = barangResult.rows[0].stok;
      if (currentStok < data.jumlah) {
        throw new Error('Stok tidak mencukupi');
      }
      
      // Insert transaksi
      const result = await client.query(`
        INSERT INTO transaksi_keluar (barang_id, jumlah, tanggal, alasan, catatan, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        data.barangId,
        data.jumlah,
        data.tanggal,
        data.alasan,
        data.catatan || null,
        userId
      ]);
      
      const transaksiId = result.rows[0].id;
      
      // Update stok barang
      await client.query(`
        UPDATE barang 
        SET stok = stok - $1 
        WHERE id = $2
      `, [data.jumlah, data.barangId]);
      
      await client.query('COMMIT');
      
      return this.findById(transaksiId);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  static async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM transaksi_keluar WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (filters.barangId) {
      paramCount++;
      sql += ` AND barang_id = $${paramCount}`;
      params.push(filters.barangId);
    }
    
    if (filters.alasan) {
      paramCount++;
      sql += ` AND alasan = $${paramCount}`;
      params.push(filters.alasan);
    }
    
    if (filters.startDate) {
      paramCount++;
      sql += ` AND tanggal >= $${paramCount}`;
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      paramCount++;
      sql += ` AND tanggal <= $${paramCount}`;
      params.push(filters.endDate);
    }
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }
  
  static async getMonthlyTrend(months = 6) {
    const result = await query(`
      SELECT 
        TO_CHAR(tanggal, 'YYYY-MM') as month,
        SUM(jumlah) as total
      FROM transaksi_keluar
      WHERE tanggal >= CURRENT_DATE - INTERVAL '${months} months'
      GROUP BY TO_CHAR(tanggal, 'YYYY-MM')
      ORDER BY month ASC
    `);
    
    return result.rows;
  }
  
  static async getTotalCurrentMonth() {
    const result = await query(`
      SELECT SUM(jumlah) as total
      FROM transaksi_keluar
      WHERE DATE_TRUNC('month', tanggal) = DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    return parseInt(result.rows[0].total) || 0;
  }
  
  static async getTotalByMonth(year, month) {
    const result = await query(`
      SELECT SUM(jumlah) as total
      FROM transaksi_keluar
      WHERE EXTRACT(YEAR FROM tanggal) = $1 
        AND EXTRACT(MONTH FROM tanggal) = $2
    `, [year, month]);
    
    return parseInt(result.rows[0].total) || 0;
  }
  
  static async getByReason() {
    const result = await query(`
      SELECT alasan, COUNT(*) as count, SUM(jumlah) as total
      FROM transaksi_keluar
      GROUP BY alasan
      ORDER BY total DESC
    `);
    
    return result.rows;
  }
  
  static formatTransaksi(item) {
    return {
      id: item.id,
      barang: item.barang_name ? {
        id: item.barang_id,
        name: item.barang_name,
        satuan: item.barang_satuan
      } : {
        id: item.barang_id,
        name: '[Barang Terhapus]',
        satuan: '-'
      },
      jumlah: item.jumlah,
      tanggal: item.tanggal,
      alasan: item.alasan,
      catatan: item.catatan,
      createdBy: {
        id: item.created_by,
        name: item.created_by_name || '[User Terhapus]'
      },
      createdAt: item.created_at
    };
  }
}

export default TransaksiKeluar;