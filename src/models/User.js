import { query } from '../database/db.js';
import bcrypt from 'bcryptjs';

class User {
  static async findAll(filters = {}) {
    let sql = `
      SELECT id, name, email, role, status, avatar, last_login, created_at, updated_at 
      FROM users WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    if (filters.status) {
      paramCount++;
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }
    
    if (filters.role) {
      paramCount++;
      sql += ` AND role = $${paramCount}`;
      params.push(filters.role);
    }
    
    if (filters.search) {
      paramCount++;
      sql += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const result = await query(sql, params);
    return result.rows;
  }
  
  static async findById(id) {
    const result = await query(`
      SELECT id, name, email, role, status, avatar, last_login, created_at, updated_at 
      FROM users WHERE id = $1
    `, [id]);
    
    return result.rows[0] || null;
  }
  
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    return result.rows[0] || null;
  }
  
  static async create({ name, email, password, role = 'admin', status = 'active' }) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const result = await query(`
      INSERT INTO users (name, email, password, role, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, status, avatar, last_login, created_at, updated_at
    `, [name, email, hashedPassword, role, status]);
    
    return result.rows[0];
  }
  
  static async update(id, data) {
    const allowedFields = ['name', 'email', 'role', 'status', 'avatar'];
    const updates = [];
    const params = [];
    let paramCount = 0;
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        paramCount++;
        updates.push(`${field} = $${paramCount}`);
        params.push(data[field]);
      }
    }
    
    if (updates.length === 0) {
      return this.findById(id);
    }
    
    paramCount++;
    params.push(id);
    
    const result = await query(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email, role, status, avatar, last_login, created_at, updated_at
    `, params);
    
    return result.rows[0];
  }
  
  static async updatePassword(id, newPassword) {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    
    await query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, id]
    );
  }
  
  static async updateLastLogin(id) {
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }
  
  static async delete(id) {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
  
  static verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }
  
  static async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (filters.status) {
      paramCount++;
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }
    
    if (filters.role) {
      paramCount++;
      sql += ` AND role = $${paramCount}`;
      params.push(filters.role);
    }
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }
}

export default User;
