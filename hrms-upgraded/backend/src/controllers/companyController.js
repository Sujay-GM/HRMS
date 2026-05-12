const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/companies
const getAll = async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT c.*, COUNT(u.id) FILTER (WHERE u.role='employee') AS employee_count
      FROM companies c
      LEFT JOIN users u ON u.company_id = c.id AND u.is_active = true
    `;
    const params = [];
    if (search) {
      query += ` WHERE c.name ILIKE $1 OR c.industry ILIKE $1`;
      params.push(`%${search}%`);
    }
    query += ` GROUP BY c.id ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countRes = await pool.query('SELECT COUNT(*) FROM companies');
    res.json({ companies: result.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch companies' });
  }
};

// GET /api/companies/:id
const getById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(u.id) FILTER (WHERE u.role='employee') AS employee_count
       FROM companies c LEFT JOIN users u ON u.company_id = c.id
       WHERE c.id = $1 GROUP BY c.id`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Company not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch company' });
  }
};

// POST /api/companies — creates company + admin user
const create = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      name, email, phone, website,
      address_line, city, state, country, zip_code,
      industry, company_size, registration_number,
      founded, description, theme,
      admin_name, admin_email, admin_password,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Company name and email are required' });
    }

    const companyRes = await client.query(
      `INSERT INTO companies
         (name, email, phone, website, address_line, city, state, country, zip_code,
          industry, company_size, registration_number, founded, description, theme)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        name, email.toLowerCase().trim(), phone || null, website || null,
        address_line || null, city || null, state || null, country || null, zip_code || null,
        industry || null, company_size || null, registration_number || null,
        founded || null, description || null, theme || null,
      ]
    );
    const company = companyRes.rows[0];

    let adminUser = null;
    if (admin_email && admin_password && admin_name) {
      const hashed = await bcrypt.hash(admin_password, 10);
      const adminRes = await client.query(
        `INSERT INTO users (name, email, password, role, company_id)
         VALUES ($1,$2,$3,'admin',$4) RETURNING id, name, email, role`,
        [admin_name, admin_email.toLowerCase().trim(), hashed, company.id]
      );
      adminUser = adminRes.rows[0];
    }

    await client.query('COMMIT');
    res.status(201).json({ ...company, admin: adminUser });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Company email or admin email already exists' });
    }
    res.status(500).json({ message: 'Failed to create company' });
  } finally {
    client.release();
  }
};

// PUT /api/companies/:id
const update = async (req, res) => {
  try {
    const {
      name, email, phone, website,
      address_line, city, state, country, zip_code,
      industry, company_size, registration_number,
      founded, description, is_active, theme,
    } = req.body;

    const result = await pool.query(
      `UPDATE companies SET
         name=COALESCE($1,name), email=COALESCE($2,email), phone=$3, website=$4,
         address_line=$5, city=$6, state=$7, country=$8, zip_code=$9,
         industry=$10, company_size=$11, registration_number=$12,
         founded=$13, description=$14, is_active=COALESCE($15,is_active),
         theme=$16, updated_at=NOW()
       WHERE id=$17 RETURNING *`,
      [
        name, email, phone, website,
        address_line, city, state, country, zip_code,
        industry, company_size, registration_number,
        founded, description, is_active, theme !== undefined ? theme : null,
        req.params.id,
      ]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Company not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update company' });
  }
};

// DELETE /api/companies/:id
const remove = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM companies WHERE id=$1 RETURNING id', [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Company not found' });
    res.json({ message: 'Company deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete company' });
  }
};

// GET /api/companies/:id/stats
const getStats = async (req, res) => {
  try {
    const id = req.params.id;
    const [empCount, leaveCount, attendanceToday] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM employees WHERE company_id=$1 AND is_active=true`, [id]),
      pool.query(`SELECT COUNT(*) FROM leaves WHERE company_id=$1 AND status='pending'`, [id]),
      pool.query(`SELECT COUNT(*) FROM attendance WHERE company_id=$1 AND date=CURRENT_DATE AND status='present'`, [id]),
    ]);
    res.json({
      total_employees: parseInt(empCount.rows[0].count),
      pending_leaves: parseInt(leaveCount.rows[0].count),
      present_today: parseInt(attendanceToday.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

module.exports = { getAll, getById, create, update, remove, getStats };
