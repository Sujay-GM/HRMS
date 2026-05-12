const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/employees
const getAll = async (req, res) => {
  try {
    const { search, department, limit = 100, offset = 0, all } = req.query;
    const params = [];
    let conditions = ['1=1'];

    if (req.user.role !== 'super_admin' || !all) {
      conditions.push(`u.company_id = $${params.length + 1}`);
      params.push(req.user.company_id);
    }
    if (search) {
      conditions.push(`(u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }
    if (department) {
      conditions.push(`e.department = $${params.length + 1}`);
      params.push(department);
    }

    const whereClause = conditions.join(' AND ');
    const query = `
      SELECT e.id, u.name, u.email, u.phone, u.is_active, u.company_id,
             e.employee_code, e.department, e.position, e.employment_type,
             e.work_location, e.date_of_joining, e.date_of_birth, e.gender,
             e.salary, e.salary_type, e.currency, e.user_id,
             c.name AS company_name
      FROM employees e
      JOIN users u ON u.id = e.user_id
      JOIN companies c ON c.id = e.company_id
      WHERE ${whereClause}
      ORDER BY u.name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ employees: result.rows, total: result.rowCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch employees' });
  }
};

// GET /api/employees/:id
const getById = async (req, res) => {
  try {
    const empResult = await pool.query(
      `SELECT e.*, u.name, u.email, u.phone, u.is_active, u.address, u.last_login,
              c.name AS company_name
       FROM employees e
       JOIN users u ON u.id = e.user_id
       JOIN companies c ON c.id = e.company_id
       WHERE e.id = $1`,
      [req.params.id]
    );
    if (!empResult.rows.length) return res.status(404).json({ message: 'Employee not found' });

    const ecResult = await pool.query(
      `SELECT * FROM emergency_contacts WHERE employee_id = $1 LIMIT 1`,
      [req.params.id]
    );

    res.json({ ...empResult.rows[0], emergency_contact: ecResult.rows[0] || null });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch employee' });
  }
};

// POST /api/employees
const create = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      name, email, password, phone,
      department, position, employment_type, work_location,
      date_of_birth, date_of_joining, gender,
      salary, salary_type, currency,
      emergency_contact,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const company_id = req.user.company_id;
    const hashed = await bcrypt.hash(password, 10);

    const userRes = await client.query(
      `INSERT INTO users (name, email, password, role, company_id, phone)
       VALUES ($1,$2,$3,'employee',$4,$5) RETURNING *`,
      [name, email.toLowerCase().trim(), hashed, company_id, phone || null]
    );
    const user = userRes.rows[0];

    const countRes = await client.query(
      'SELECT COUNT(*) FROM employees WHERE company_id=$1', [company_id]
    );
    const empCode = `EMP${String(parseInt(countRes.rows[0].count) + 1).padStart(3, '0')}`;

    const empRes = await client.query(
      `INSERT INTO employees
         (user_id, company_id, employee_code, department, position, employment_type,
          work_location, date_of_birth, date_of_joining, gender, salary, salary_type, currency)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        user.id, company_id, empCode, department || null, position || null,
        employment_type || 'full_time', work_location || null,
        date_of_birth || null, date_of_joining || null, gender || null,
        salary || null, salary_type || 'annual', currency || 'INR',
      ]
    );
    const emp = empRes.rows[0];

    let ec = null;
    if (emergency_contact?.contact_name) {
      const ecRes = await client.query(
        `INSERT INTO emergency_contacts
           (employee_id, contact_name, relationship, phone, alternate_phone, address)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          emp.id,
          emergency_contact.contact_name,
          emergency_contact.relationship || null,
          emergency_contact.phone || null,
          emergency_contact.alternate_phone || null,
          emergency_contact.address || null,
        ]
      );
      ec = ecRes.rows[0];
    }

    await client.query('COMMIT');
    res.status(201).json({
      ...emp,
      name: user.name,
      email: user.email,
      phone: user.phone,
      emergency_contact: ec,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ message: 'Employee email already exists' });
    res.status(500).json({ message: 'Failed to create employee' });
  } finally {
    client.release();
  }
};

// PUT /api/employees/:id
const update = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      name, email, phone, department, position, employment_type, work_location,
      date_of_birth, date_of_joining, gender, salary, salary_type, currency,
      is_active, password, emergency_contact,
    } = req.body;

    const empResult = await client.query(
      'SELECT user_id FROM employees WHERE id=$1', [req.params.id]
    );
    if (!empResult.rows.length) return res.status(404).json({ message: 'Employee not found' });
    const { user_id } = empResult.rows[0];

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await client.query(
        `UPDATE users SET name=COALESCE($1,name), email=COALESCE($2,email), phone=$3,
         is_active=COALESCE($4,is_active), password=$5, updated_at=NOW() WHERE id=$6`,
        [name, email, phone, is_active, hashed, user_id]
      );
    } else {
      await client.query(
        `UPDATE users SET name=COALESCE($1,name), email=COALESCE($2,email), phone=$3,
         is_active=COALESCE($4,is_active), updated_at=NOW() WHERE id=$5`,
        [name, email, phone, is_active, user_id]
      );
    }

    const empUpdateRes = await client.query(
      `UPDATE employees SET
         department=$1, position=$2, employment_type=$3, work_location=$4,
         date_of_birth=$5, date_of_joining=$6, gender=$7,
         salary=$8, salary_type=$9, currency=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [
        department, position, employment_type || 'full_time', work_location,
        date_of_birth || null, date_of_joining || null, gender,
        salary || null, salary_type || 'annual', currency || 'INR',
        req.params.id,
      ]
    );

    if (emergency_contact) {
      const existing = await client.query(
        'SELECT id FROM emergency_contacts WHERE employee_id=$1', [req.params.id]
      );
      if (existing.rows.length) {
        await client.query(
          `UPDATE emergency_contacts SET
             contact_name=$1, relationship=$2, phone=$3, alternate_phone=$4,
             address=$5, updated_at=NOW()
           WHERE employee_id=$6`,
          [
            emergency_contact.contact_name, emergency_contact.relationship,
            emergency_contact.phone, emergency_contact.alternate_phone,
            emergency_contact.address, req.params.id,
          ]
        );
      } else if (emergency_contact.contact_name) {
        await client.query(
          `INSERT INTO emergency_contacts
             (employee_id, contact_name, relationship, phone, alternate_phone, address)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            req.params.id, emergency_contact.contact_name,
            emergency_contact.relationship, emergency_contact.phone,
            emergency_contact.alternate_phone, emergency_contact.address,
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.json(empUpdateRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Failed to update employee' });
  } finally {
    client.release();
  }
};

// DELETE /api/employees/:id
const remove = async (req, res) => {
  try {
    const empResult = await pool.query(
      'SELECT user_id FROM employees WHERE id=$1', [req.params.id]
    );
    if (!empResult.rows.length) return res.status(404).json({ message: 'Employee not found' });
    await pool.query('DELETE FROM users WHERE id=$1', [empResult.rows[0].user_id]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete employee' });
  }
};

module.exports = { getAll, getById, create, update, remove };
