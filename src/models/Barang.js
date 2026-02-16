import { query } from '../database/db.js';

class Barang {
  static async findAll(filters = {}) {
    let sql = `
      SELECT b.*, 
        k.id as kategori_id, k.name as kategori_name, k.description as kategori_description
      FROM barang b
      LEFT JOIN kategori k ON b.kategori_id = k.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    if (filters.kategoriId) {
      paramCount++;
      sql += ` AND b.kategori_id = $${paramCount}`;
      params.push(filters.kategoriId);
    }
    
    if (filters.kondisi) {
      paramCount++;
      sql += ` AND b.kondisi = $${paramCount}`;
      params.push(filters.kondisi);
    }
    
    if (filters.stokStatus === 'low') {
      sql += ' AND b.stok <= b.stok_minimum';
    } else if (filters.stokStatus === 'normal') {
      sql += ' AND b.stok > b.stok_minimum';
    }
    
    if (filters.search) {
      paramCount++;
      sql += ` AND b.name ILIKE $${paramCount}`;
      params.push(`%${filters.search}%`);
    }
    
    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    
    sql += ' ORDER BY b.updated_at DESC';
    
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await query(sql, params);
    
    // Format results
    return result.rows.map(item => this.formatBarang(item));
  }
  
  static async findById(id) {
    const result = await query(`
      SELECT b.*, 
        k.id as kategori_id, k.name as kategori_name, k.description as kategori_description
      FROM barang b
      LEFT JOIN kategori k ON b.kategori_id = k.id
      WHERE b.id = $1
    `, [id]);
    
    return result.rows[0] ? this.formatBarang(result.rows[0]) : null;
  }
  
  static async create(data) {
    const result = await query(`
      INSERT INTO barang (
        name, kategori_id, satuan, stok, stok_minimum, harga_per_unit,
        lokasi, kondisi, tanggal_kadaluarsa, catatan
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      data.name,
      data.kategoriId,
      data.satuan,
      data.stok || 0,
      data.stokMinimum || 0,
      data.hargaPerUnit || 0,
      data.lokasi,
      data.kondisi || 'baik',
      data.tanggalKadaluarsa || null,
      data.catatan || null
    ]);
    
    const newId = result.rows[0].id;
    return this.findById(newId);
  }
  
  static async update(id, data) {
    const allowedFields = {
      name: 'name',
      kategoriId: 'kategori_id',
      satuan: 'satuan',
      stok: 'stok',
      stokMinimum: 'stok_minimum',
      hargaPerUnit: 'harga_per_unit',
      lokasi: 'lokasi',
      kondisi: 'kondisi',
      tanggalKadaluarsa: 'tanggal_kadaluarsa',
      catatan: 'catatan'
    };
    
    const updates = [];
    const params = [];
    let paramCount = 0;
    
    for (const [jsField, dbField] of Object.entries(allowedFields)) {
      if (data[jsField] !== undefined) {
        paramCount++;
        updates.push(`${dbField} = $${paramCount}`);
        params.push(data[jsField]);
      }
    }
    
    if (updates.length === 0) {
      return this.findById(id);
    }
    
    paramCount++;
    params.push(id);
    
    await query(`
      UPDATE barang 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
    `, params);
    
    return this.findById(id);
  }
  
  static async updateStok(id, jumlah, operation = 'add') {
    const barang = await this.findById(id);
    if (!barang) throw new Error('Barang tidak ditemukan');
    
    let newStok;
    if (operation === 'add') {
      newStok = barang.stok + jumlah;
    } else {
      newStok = barang.stok - jumlah;
      if (newStok < 0) throw new Error('Stok tidak mencukupi');
    }
    
    await query(
      'UPDATE barang SET stok = $1 WHERE id = $2',
      [newStok, id]
    );
    
    return this.findById(id);
  }
  
  static async delete(id) {
    // Check for existing transactions
    const masukResult = await query(
      'SELECT COUNT(*) as count FROM transaksi_masuk WHERE barang_id = $1',
      [id]
    );
    const keluarResult = await query(
      'SELECT COUNT(*) as count FROM transaksi_keluar WHERE barang_id = $1',
      [id]
    );
    
    const masukCount = parseInt(masukResult.rows[0].count);
    const keluarCount = parseInt(keluarResult.rows[0].count);
    
    if (masukCount > 0 || keluarCount > 0) {
      throw new Error('Barang memiliki riwayat transaksi, tidak dapat dihapus');
    }
    
    const result = await query('DELETE FROM barang WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
  
  static async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM barang WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (filters.kategoriId) {
      paramCount++;
      sql += ` AND kategori_id = $${paramCount}`;
      params.push(filters.kategoriId);
    }
    
    if (filters.kondisi) {
      paramCount++;
      sql += ` AND kondisi = $${paramCount}`;
      params.push(filters.kondisi);
    }
    
    if (filters.stokStatus === 'low') {
      sql += ' AND stok <= stok_minimum';
    }
    
    if (filters.search) {
      paramCount++;
      sql += ` AND name ILIKE $${paramCount}`;
      params.push(`%${filters.search}%`);
    }
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }
  
  static async getLowStockItems() {
    const result = await query(`
      SELECT b.*, 
        k.id as kategori_id, k.name as kategori_name, k.description as kategori_description
      FROM barang b
      LEFT JOIN kategori k ON b.kategori_id = k.id
      WHERE b.stok <= b.stok_minimum
      ORDER BY b.stok ASC
    `);
    
    return result.rows.map(item => this.formatBarang(item));
  }
  
  static async getDamagedItems() {
    const result = await query(`
      SELECT b.*, 
        k.id as kategori_id, k.name as kategori_name, k.description as kategori_description
      FROM barang b
      LEFT JOIN kategori k ON b.kategori_id = k.id
      WHERE b.kondisi IN ('rusak', 'kadaluarsa')
      ORDER BY b.updated_at DESC
    `);
    
    return result.rows.map(item => this.formatBarang(item));
  }
  
  static async getTotalValue() {
    const result = await query(
      'SELECT SUM(stok * harga_per_unit) as total FROM barang'
    );
    return parseFloat(result.rows[0].total) || 0;
  }
  
  static async getTopUsedItems(limit = 8) {
    const result = await query(`
      SELECT b.name, SUM(tk.jumlah) as value
      FROM transaksi_keluar tk
      JOIN barang b ON tk.barang_id = b.id
      GROUP BY b.id, b.name
      ORDER BY value DESC
      LIMIT $1
    `, [limit]);
    
    return result.rows;
  }
  
  static formatBarang(item) {
    return {
      id: item.id,
      name: item.name,
      kategori: {
        id: item.kategori_id,
        name: item.kategori_name,
        description: item.kategori_description
      },
      satuan: item.satuan,
      stok: item.stok,
      stokMinimum: item.stok_minimum,
      hargaPerUnit: parseFloat(item.harga_per_unit),
      lokasi: item.lokasi,
      kondisi: item.kondisi,
      tanggalKadaluarsa: item.tanggal_kadaluarsa,
      catatan: item.catatan,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
  }
}

export default Barang;
