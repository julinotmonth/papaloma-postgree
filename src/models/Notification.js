import { query } from '../database/db.js';

class Notification {
  static async findAll(userId = null, filters = {}) {
    let sql = `
      SELECT * FROM notifications 
      WHERE (user_id = $1 OR user_id IS NULL)
    `;
    const params = [userId];
    let paramCount = 1;
    
    if (filters.read !== undefined) {
      paramCount++;
      sql += ` AND read = $${paramCount}`;
      params.push(filters.read);
    }
    
    if (filters.type) {
      paramCount++;
      sql += ` AND type = $${paramCount}`;
      params.push(filters.type);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    if (filters.limit) {
      paramCount++;
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }
    
    const result = await query(sql, params);
    return result.rows;
  }
  
  static async findById(id) {
    const result = await query(
      'SELECT * FROM notifications WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }
  
  static async create({ userId = null, type, title, message }) {
    const result = await query(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [userId, type, title, message]);
    
    return result.rows[0];
  }
  
  static async markAsRead(id) {
    const result = await query(`
      UPDATE notifications 
      SET read = TRUE 
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    return result.rows[0];
  }
  
  static async markAllAsRead(userId = null) {
    await query(`
      UPDATE notifications 
      SET read = TRUE 
      WHERE (user_id = $1 OR user_id IS NULL) AND read = FALSE
    `, [userId]);
    
    return true;
  }
  
  static async delete(id) {
    const result = await query(
      'DELETE FROM notifications WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }
  
  static async deleteAll(userId = null) {
    await query(
      'DELETE FROM notifications WHERE user_id = $1 OR user_id IS NULL',
      [userId]
    );
    return true;
  }
  
  static async getUnreadCount(userId = null) {
    const result = await query(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE (user_id = $1 OR user_id IS NULL) AND read = FALSE
    `, [userId]);
    
    return parseInt(result.rows[0].count);
  }
  
  static async countAll(userId = null, filters = {}) {
    let sql = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE (user_id = $1 OR user_id IS NULL)
    `;
    const params = [userId];
    let paramCount = 1;
    
    if (filters.read !== undefined) {
      paramCount++;
      sql += ` AND read = $${paramCount}`;
      params.push(filters.read);
    }
    
    if (filters.type) {
      paramCount++;
      sql += ` AND type = $${paramCount}`;
      params.push(filters.type);
    }
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }
  
  // Helper methods for creating notifications
  static async createTransactionNotification(type, barang, jumlah, userName) {
    const typeMap = {
      'masuk': 'success',
      'keluar': 'warning'
    };
    
    const actionMap = {
      'masuk': 'ditambahkan',
      'keluar': 'dikeluarkan'
    };
    
    return this.create({
      userId: null, // Broadcast to all users
      type: typeMap[type] || 'info',
      title: `Barang ${actionMap[type]}`,
      message: `${jumlah} ${barang.satuan} ${barang.name} ${actionMap[type]} oleh ${userName}`
    });
  }
  
  static async createLowStockNotification(barang) {
    return this.create({
      userId: null, // Broadcast to all users
      type: 'warning',
      title: 'Stok Rendah',
      message: `${barang.name} stok tersisa ${barang.stok} ${barang.satuan}, di bawah minimum ${barang.stokMinimum}`
    });
  }
  
  static async createExpiredNotification(barang) {
    return this.create({
      userId: null,
      type: 'danger',
      title: 'Barang Kadaluarsa',
      message: `${barang.name} telah melewati tanggal kadaluarsa`
    });
  }
}

export default Notification;