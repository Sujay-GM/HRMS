const pool = require('../config/db');

// GET /api/attendance
const getAll = async (req, res) => {
  try {
    const { date, employee_id, month } = req.query;
    const params = [req.user.company_id];
    let conditions = ['a.company_id = $1'];

    if (date) { conditions.push(`a.date = $${params.length + 1}`); params.push(date); }
    if (employee_id) { conditions.push(`a.employee_id = $${params.length + 1}`); params.push(employee_id); }
    if (month) { conditions.push(`TO_CHAR(a.date,'YYYY-MM') = $${params.length + 1}`); params.push(month); }

    const result = await pool.query(
      `SELECT a.*, u.name AS employee, e.department,
              TO_CHAR(a.check_in_time, 'HH24:MI') AS check_in,
              TO_CHAR(a.check_out_time, 'HH24:MI') AS check_out
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       JOIN users u ON u.id = e.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.date DESC, u.name`,
      params
    );
    res.json({ attendance: result.rows, total: result.rowCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
};

// GET /api/attendance/today
const getToday = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name AS employee, e.department,
              TO_CHAR(a.check_in_time, 'HH24:MI') AS check_in,
              TO_CHAR(a.check_out_time, 'HH24:MI') AS check_out
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       JOIN users u ON u.id = e.user_id
       WHERE a.company_id=$1 AND a.date=CURRENT_DATE
       ORDER BY u.name`,
      [req.user.company_id]
    );
    res.json({ attendance: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch today attendance' });
  }
};

// GET /api/attendance/me  — employee's own attendance
const getMe = async (req, res) => {
  try {
    const empRes = await pool.query(
      'SELECT id FROM employees WHERE user_id=$1', [req.user.id]
    );
    if (!empRes.rows.length) return res.status(404).json({ message: 'Employee profile not found' });
    const empId = empRes.rows[0].id;

    const { month } = req.query;
    const params = [empId];
    let dateFilter = '';
    if (month) {
      dateFilter = `AND TO_CHAR(a.date,'YYYY-MM') = $${params.length + 1}`;
      params.push(month);
    }

    const result = await pool.query(
      `SELECT a.*,
              TO_CHAR(a.check_in_time, 'HH24:MI') AS check_in,
              TO_CHAR(a.check_out_time, 'HH24:MI') AS check_out,
              CASE
                WHEN a.check_in_time IS NOT NULL AND a.check_out_time IS NOT NULL
                THEN ROUND(EXTRACT(EPOCH FROM (a.check_out_time - a.check_in_time))/3600, 2)
                ELSE NULL
              END AS hours_worked
       FROM attendance a
       WHERE a.employee_id = $1 ${dateFilter}
       ORDER BY a.date DESC
       LIMIT 60`,
      params
    );

    // get today's record
    const todayRes = await pool.query(
      `SELECT *,
              TO_CHAR(check_in_time, 'HH24:MI:SS') AS check_in,
              TO_CHAR(check_out_time, 'HH24:MI:SS') AS check_out
       FROM attendance WHERE employee_id=$1 AND date=CURRENT_DATE`,
      [empId]
    );

    res.json({
      attendance: result.rows,
      today: todayRes.rows[0] || null,
      employee_id: empId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
};

// POST /api/attendance/check-in
const checkIn = async (req, res) => {
  try {
    const empRes = await pool.query(
      'SELECT id, company_id FROM employees WHERE user_id=$1', [req.user.id]
    );
    if (!empRes.rows.length) return res.status(404).json({ message: 'Employee profile not found' });
    const { id: empId, company_id } = empRes.rows[0];

    // Prevent duplicate check-in without check-out
    const existing = await pool.query(
      'SELECT * FROM attendance WHERE employee_id=$1 AND date=CURRENT_DATE', [empId]
    );
    if (existing.rows.length) {
      const rec = existing.rows[0];
      if (rec.check_in_time && !rec.check_out_time) {
        return res.status(400).json({ message: 'Already checked in. Please check out first.' });
      }
      if (rec.check_in_time && rec.check_out_time) {
        return res.status(400).json({ message: 'Already completed attendance for today.' });
      }
    }

    const result = await pool.query(
      `INSERT INTO attendance (employee_id, company_id, date, check_in_time, status, notes)
       VALUES ($1,$2,CURRENT_DATE,NOW(),'present',$3)
       ON CONFLICT (employee_id, date) DO UPDATE
         SET check_in_time=NOW(), check_out_time=NULL, status='present', updated_at=NOW()
       RETURNING *,
         TO_CHAR(check_in_time, 'HH24:MI:SS') AS check_in,
         TO_CHAR(check_out_time, 'HH24:MI:SS') AS check_out`,
      [empId, company_id, req.body.notes || null]
    );
    res.status(201).json({ message: 'Checked in successfully', attendance: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to check in' });
  }
};

// POST /api/attendance/check-out
const checkOut = async (req, res) => {
  try {
    const empRes = await pool.query(
      'SELECT id FROM employees WHERE user_id=$1', [req.user.id]
    );
    if (!empRes.rows.length) return res.status(404).json({ message: 'Employee profile not found' });
    const empId = empRes.rows[0].id;

    const existing = await pool.query(
      'SELECT * FROM attendance WHERE employee_id=$1 AND date=CURRENT_DATE', [empId]
    );
    if (!existing.rows.length || !existing.rows[0].check_in_time) {
      return res.status(400).json({ message: 'No check-in found for today. Please check in first.' });
    }
    if (existing.rows[0].check_out_time) {
      return res.status(400).json({ message: 'Already checked out for today.' });
    }

    const result = await pool.query(
      `UPDATE attendance SET check_out_time=NOW(), updated_at=NOW()
       WHERE employee_id=$1 AND date=CURRENT_DATE
       RETURNING *,
         TO_CHAR(check_in_time, 'HH24:MI:SS') AS check_in,
         TO_CHAR(check_out_time, 'HH24:MI:SS') AS check_out,
         ROUND(EXTRACT(EPOCH FROM (check_out_time - check_in_time))/3600, 2) AS hours_worked`,
      [empId]
    );
    res.json({ message: 'Checked out successfully', attendance: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to check out' });
  }
};

// GET /api/attendance/report
const getReport = async (req, res) => {
  try {
    const { month = new Date().toISOString().slice(0, 7) } = req.query;
    const result = await pool.query(
      `SELECT u.name, e.department,
              COUNT(*) FILTER (WHERE a.status='present') AS present_days,
              COUNT(*) FILTER (WHERE a.status='absent')  AS absent_days,
              COUNT(*) FILTER (WHERE a.status='leave')   AS leave_days,
              COUNT(*) FILTER (WHERE a.status='half-day') AS half_days
       FROM employees e
       JOIN users u ON u.id = e.user_id
       LEFT JOIN attendance a ON a.employee_id = e.id AND TO_CHAR(a.date,'YYYY-MM')=$1
       WHERE e.company_id=$2
       GROUP BY u.name, e.department
       ORDER BY u.name`,
      [month, req.user.company_id]
    );
    res.json({ report: result.rows, month });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate report' });
  }
};

module.exports = { getAll, getToday, getMe, checkIn, checkOut, getReport };
