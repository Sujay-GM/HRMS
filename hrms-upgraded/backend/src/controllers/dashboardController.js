const pool = require('../config/db');

// GET /api/dashboard/super-admin/stats
const superAdminStats = async (req, res) => {
  try {
    const [companies, admins, employees, active] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM companies WHERE is_active=true`),
      pool.query(`SELECT COUNT(*) FROM users WHERE role='admin' AND is_active=true`),
      pool.query(`SELECT COUNT(*) FROM users WHERE role='employee' AND is_active=true`),
      pool.query(`SELECT COUNT(*) FROM attendance WHERE date=CURRENT_DATE AND status='present'`),
    ]);
    res.json({
      companies: parseInt(companies.rows[0].count),
      admins: parseInt(admins.rows[0].count),
      employees: parseInt(employees.rows[0].count),
      active: parseInt(active.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

// GET /api/dashboard/admin/stats
const adminStats = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const [total, present, onLeave, pendingLeaves] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM employees WHERE company_id=$1 AND is_active=true`, [company_id]),
      pool.query(`SELECT COUNT(*) FROM attendance WHERE company_id=$1 AND date=CURRENT_DATE AND status='present'`, [company_id]),
      pool.query(`SELECT COUNT(*) FROM attendance WHERE company_id=$1 AND date=CURRENT_DATE AND status='leave'`, [company_id]),
      pool.query(`SELECT COUNT(*) FROM leaves WHERE company_id=$1 AND status='pending'`, [company_id]),
    ]);
    res.json({
      total_employees: parseInt(total.rows[0].count),
      present_today: parseInt(present.rows[0].count),
      on_leave: parseInt(onLeave.rows[0].count),
      pending_leaves: parseInt(pendingLeaves.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
};

// GET /api/dashboard/employee/stats
const employeeStats = async (req, res) => {
  try {
    const empRes = await pool.query('SELECT id FROM employees WHERE user_id=$1', [req.user.id]);
    if (!empRes.rows.length) return res.json({});
    const empId = empRes.rows[0].id;
    const month = new Date().toISOString().slice(0, 7);

    const [present, leaves, salary] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM attendance WHERE employee_id=$1 AND TO_CHAR(date,'YYYY-MM')=$2 AND status='present'`, [empId, month]),
      pool.query(`SELECT COUNT(*) FROM leaves WHERE employee_id=$1 AND status='approved' AND TO_CHAR(from_date,'YYYY-MM')=$2`, [empId, month]),
      pool.query(`SELECT net_pay FROM payroll WHERE employee_id=$1 AND month=$2`, [empId, month]),
    ]);

    res.json({
      present_this_month: parseInt(present.rows[0].count),
      leaves_taken: parseInt(leaves.rows[0].count),
      leaves_remaining: 14 - parseInt(leaves.rows[0].count),
      last_salary: salary.rows[0]?.net_pay || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch employee stats' });
  }
};


// GET /api/dashboard/super-admin/leave-stats
const superAdminLeaveStats = async (req, res) => {
  try {
    const [total, pending, approved] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM leaves`),
      pool.query(`SELECT COUNT(*) FROM leaves WHERE status='pending'`),
      pool.query(`SELECT COUNT(*) FROM leaves WHERE status='approved'`),
    ]);
    res.json({
      total: parseInt(total.rows[0].count),
      pending: parseInt(pending.rows[0].count),
      approved: parseInt(approved.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch leave stats' });
  }
};

module.exports = { superAdminStats, adminStats, employeeStats, superAdminLeaveStats };
