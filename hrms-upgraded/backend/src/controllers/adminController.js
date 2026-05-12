const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/admins
const getAll = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.is_active, u.company_id, u.created_at,
              c.name AS company_name
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.role = 'admin'
       ORDER BY u.created_at DESC`
    );
    res.json({ admins: result.rows, total: result.rowCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admins' });
  }
};

// GET /api/admins/:id
const getById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.*, c.name AS company_name FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.id=$1 AND u.role='admin'`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Admin not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admin' });
  }
};

// POST /api/admins
const create = async (req, res) => {
  try {
    const { name, email, password, phone, company_id } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, phone, company_id) VALUES ($1,$2,$3,'admin',$4,$5) RETURNING id, name, email, role, phone, company_id, is_active`,
      [name, email.toLowerCase(), hashed, phone, company_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Email already exists' });
    res.status(500).json({ message: 'Failed to create admin' });
  }
};

// PUT /api/admins/:id
const update = async (req, res) => {
  try {
    const { name, email, phone, company_id, is_active, password } = req.body;
    let query, params;

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      query = `UPDATE users SET name=COALESCE($1,name), email=COALESCE($2,email), phone=$3,
               company_id=$4, is_active=COALESCE($5,is_active), password=$6, updated_at=NOW()
               WHERE id=$7 AND role='admin' RETURNING id, name, email, role, phone, company_id, is_active`;
      params = [name, email, phone, company_id, is_active, hashed, req.params.id];
    } else {
      query = `UPDATE users SET name=COALESCE($1,name), email=COALESCE($2,email), phone=$3,
               company_id=$4, is_active=COALESCE($5,is_active), updated_at=NOW()
               WHERE id=$6 AND role='admin' RETURNING id, name, email, role, phone, company_id, is_active`;
      params = [name, email, phone, company_id, is_active, req.params.id];
    }

    const result = await pool.query(query, params);
    if (!result.rows.length) return res.status(404).json({ message: 'Admin not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update admin' });
  }
};

// DELETE /api/admins/:id
const remove = async (req, res) => {
  try {
    const result = await pool.query(`DELETE FROM users WHERE id=$1 AND role='admin' RETURNING id`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Admin not found' });
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete admin' });
  }
};

module.exports = { getAll, getById, create, update, remove };
