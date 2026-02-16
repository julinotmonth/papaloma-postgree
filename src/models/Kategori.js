import { query } from '../database/db.js';

class Kategori {
  static async findAll() {
    const result = await query(
      'SELECT * FROM kategori ORDER BY name ASC'
    );
    return result.rows;
  }
  
  static async findById(id) {
    const result = await query(
      'SELECT * FROM kategori WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }
  
  static async findByName(name) {
    const result = await query(
      'SELECT * FROM kategori WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    return result.rows[0] || null;
  }
  
  static async create({ name, description }) {
    const result = await query(`
      INSERT INTO kategori (name, description)
      VALUES ($1, $2)
      RETURNING *
    `, [name, description || null]);
    
    return result.rows[0];
  }
  
  static async update(id, { name, description }) {
    const updates = [];
    const params = [];
    let paramCount = 0;
    
    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }
    
    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(description);
    }
    
    if (updates.length === 0) {
      return this.findById(id);
    }
    
    paramCount++;
    params.push(id);
    
    const result = await query(`
      UPDATE kategori 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, params);
    
    return result.rows[0];
  }
  
  static async delete(id) {
    // Check if kategori has barang
    const checkResult = await query(
      'SELECT COUNT(*) as count FROM barang WHERE kategori_id = $1',
      [id]
    );
    
    const count = parseInt(checkResult.rows[0].count);
    if (count > 0) {
      throw new Error('Kategori masih memiliki barang, tidak dapat dihapus');
    }
    
    const result = await query('DELETE FROM kategori WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
  
  static async getDistribution() {
    const result = await query(`
      SELECT k.name, COUNT(b.id) as count
      FROM kategori k
      LEFT JOIN barang b ON k.id = b.kategori_id
      GROUP BY k.id, k.name
      ORDER BY count DESC
    `);
    
    return result.rows;
  }
}

export default Kategori;