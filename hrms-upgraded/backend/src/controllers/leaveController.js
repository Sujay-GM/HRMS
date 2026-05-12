const pool = require('../config/db');

// GET /api/leaves
const getAll = async (req, res) => {
  try {
    const { status, employee_id } = req.query;
    const params = [];
    let conditions = [];

    // Scope by company for admin, by employee for employee
    if (req.user.role === 'employee') {
      const empRes = await pool.query('SELECT id FROM employees WHERE user_id=$1', [req.user.id]);
      if (!empRes.rows.length) return res.json({ leaves: [] });
      conditions.push(`l.employee_id = $${params.length + 1}`);
      params.push(empRes.rows[0].id);
    } else {
      conditions.push(`l.company_id = $${params.length + 1}`);
      params.push(req.user.company_id);
    }

    if (status) { conditions.push(`l.status = $${params.length + 1}`); params.push(status); }
    if (employee_id && req.user.role !== 'employee') { conditions.push(`l.employee_id = $${params.length + 1}`); params.push(employee_id); }

    const result = await pool.query(
      `SELECT l.*, u.name AS employee_name, e.department
       FROM leaves l
       JOIN employees e ON e.id = l.employee_id
       JOIN users u ON u.id = e.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY l.created_at DESC`,
      params
    );
    res.json({ leaves: result.rows, total: result.rowCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch leaves' });
  }
};

// POST /api/leaves
const create = async (req, res) => {
  try {
    const { leave_type, from_date, to_date, reason, employee_id } = req.body;
    if (!leave_type || !from_date || !to_date) return res.status(400).json({ message: 'Leave type and dates are required' });

    let empId = employee_id;
    let company_id = req.user.company_id;

    if (req.user.role === 'employee') {
      const empRes = await pool.query('SELECT id, company_id FROM employees WHERE user_id=$1', [req.user.id]);
      if (!empRes.rows.length) return res.status(404).json({ message: 'Employee profile not found' });
      empId = empRes.rows[0].id;
      company_id = empRes.rows[0].company_id;
    }

    const from = new Date(from_date);
    const to = new Date(to_date);
    const days = Math.max(1, Math.round((to - from) / (1000 * 60 * 60 * 24)) + 1);

    const result = await pool.query(
      `INSERT INTO leaves (employee_id, company_id, leave_type, from_date, to_date, days, reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [empId, company_id, leave_type, from_date, to_date, days, reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create leave request' });
  }
};

// PUT /api/leaves/:id/approve
const approve = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE leaves SET status='approved', reviewed_by=$1, reviewed_at=NOW(), updated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [req.user.id, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Leave not found' });

    // Mark attendance as leave
    const leave = result.rows[0];
    const from = new Date(leave.from_date);
    const to = new Date(leave.to_date);
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      await pool.query(
        `INSERT INTO attendance (employee_id, company_id, date, status)
         VALUES ($1,$2,$3,'leave')
         ON CONFLICT (employee_id, date) DO UPDATE SET status='leave'`,
        [leave.employee_id, leave.company_id, d.toISOString().slice(0, 10)]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve leave' });
  }
};

// PUT /api/leaves/:id/reject
const reject = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await pool.query(
      `UPDATE leaves SET status='rejected', reviewed_by=$1, review_note=$2, reviewed_at=NOW(), updated_at=NOW()
       WHERE id=$3 RETURNING *`,
      [req.user.id, reason, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Leave not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject leave' });
  }
};

// DELETE /api/leaves/:id
const remove = async (req, res) => {
  try {
    const result = await pool.query(`DELETE FROM leaves WHERE id=$1 AND status='pending' RETURNING id`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Leave not found or already processed' });
    res.json({ message: 'Leave request deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete leave' });
  }
};

module.exports = { getAll, create, approve, reject, remove };
