import { query } from '../database/db.js';

class ActivityLog {
  static async findAll(filters = {}) {
    let sql = `
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    if (filters.userId) {
      paramCount++;
      sql += ` AND al.user_id = $${paramCount}`;
      params.push(filters.userId);
    }
    
    if (filters.entityType) {
      paramCount++;
      sql += ` AND al.entity_type = $${paramCount}`;
      params.push(filters.entityType);
    }
    
    if (filters.startDate) {
      paramCount++;
      sql += ` AND al.created_at >= $${paramCount}`;
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      paramCount++;
      sql += ` AND al.created_at <= $${paramCount}`;
      params.push(filters.endDate);
    }
    
    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    
    sql += ' ORDER BY al.created_at DESC';
    
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await query(sql, params);
    return result.rows.map(item => this.formatLog(item));
  }
  
  static async findByUserId(userId, limit = 50) {
    const result = await query(`
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.user_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2
    `, [userId, limit]);
    
    return result.rows.map(item => this.formatLog(item));
  }
  
  static async create({ userId, action, entityType = null, entityId = null, details = null }) {
    const result = await query(`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, action, entityType, entityId, details]);
    
    return result.rows[0];
  }
  
  static async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM activity_logs WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (filters.userId) {
      paramCount++;
      sql += ` AND user_id = $${paramCount}`;
      params.push(filters.userId);
    }
    
    if (filters.entityType) {
      paramCount++;
      sql += ` AND entity_type = $${paramCount}`;
      params.push(filters.entityType);
    }
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }
  
  static async deleteOld(days = 90) {
    const result = await query(`
      DELETE FROM activity_logs 
      WHERE created_at < CURRENT_DATE - INTERVAL '${days} days'
    `);
    
    return result.rowCount;
  }
  
  // Helper methods for common actions
  static async logBarangCreated(userId, barang) {
    return this.create({
      userId,
      action: 'create',
      entityType: 'barang',
      entityId: barang.id,
      details: JSON.stringify({ name: barang.name })
    });
  }
  
  static async logBarangUpdated(userId, barang) {
    return this.create({
      userId,
      action: 'update',
      entityType: 'barang',
      entityId: barang.id,
      details: JSON.stringify({ name: barang.name })
    });
  }
  
  static async logBarangDeleted(userId, barang) {
    return this.create({
      userId,
      action: 'delete',
      entityType: 'barang',
      entityId: barang.id,
      details: JSON.stringify({ name: barang.name })
    });
  }
  
  static async logTransaksiMasuk(userId, barang, jumlah) {
    return this.create({
      userId,
      action: 'transaksi_masuk',
      entityType: 'barang',
      entityId: barang.id,
      details: JSON.stringify({ name: barang.name, jumlah })
    });
  }
  
  static async logTransaksiKeluar(userId, barang, jumlah) {
    return this.create({
      userId,
      action: 'transaksi_keluar',
      entityType: 'barang',
      entityId: barang.id,
      details: JSON.stringify({ name: barang.name, jumlah })
    });
  }
  
  static formatLog(item) {
    return {
      id: item.id,
      user: {
        id: item.user_id,
        name: item.user_name,
        email: item.user_email
      },
      action: item.action,
      entityType: item.entity_type,
      entityId: item.entity_id,
      details: item.details ? JSON.parse(item.details) : null,
      createdAt: item.created_at
    };
  }
}

export default ActivityLog;