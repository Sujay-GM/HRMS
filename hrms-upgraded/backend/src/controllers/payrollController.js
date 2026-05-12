const pool = require('../config/db');

// ─── Indian Payroll Calculation ───────────────────────────────────────────────
// Indian CTC breakdown:
//   basic      = 50% of monthly CTC
//   hra        = 40% of basic  (metro HRA)
//   allowances = 10% of monthly CTC (special allowance)
//   grossPay   = basic + hra + allowances + bonus
//
//   PF  = 12% of basic, capped ₹1,800/month (statutory)
//   ESI = 0.75% of gross  (only if gross ≤ ₹21,000/month)
//   Tax = new-regime slab TDS (monthly estimate)
//
//   totalDeductions = pf + esi + tax
//   netPay          = grossPay − totalDeductions
function calculateIndianPayroll(annualSalary) {
  const monthly = parseFloat(annualSalary || 0) / 12;

  const basic      = parseFloat((monthly * 0.50).toFixed(2));
  const hra        = parseFloat((basic   * 0.40).toFixed(2));
  const allowances = parseFloat((monthly * 0.10).toFixed(2));
  const bonus      = 0;
  const grossPay   = parseFloat((basic + hra + allowances + bonus).toFixed(2));

  // Provident Fund — 12% of basic, statutory cap ₹1,800/month
  const pf = parseFloat(Math.min(basic * 0.12, 1800).toFixed(2));

  // ESI — employee contribution 0.75%, only if gross ≤ ₹21,000/month
  const esi = grossPay <= 21000
    ? parseFloat((grossPay * 0.0075).toFixed(2))
    : 0;

  // Income Tax — new-regime slabs, annual → monthly TDS
  const annualGross = grossPay * 12;
  let annualTax = 0;
  if      (annualGross > 1500000) annualTax = (annualGross - 1500000) * 0.30 + 187500;
  else if (annualGross > 1200000) annualTax = (annualGross - 1200000) * 0.20 + 127500;
  else if (annualGross > 900000)  annualTax = (annualGross -  900000) * 0.15 +  82500;
  else if (annualGross > 600000)  annualTax = (annualGross -  600000) * 0.10 +  52500;
  else if (annualGross > 300000)  annualTax = (annualGross -  300000) * 0.05;
  const tax = parseFloat((Math.max(0, annualTax) / 12).toFixed(2));

  const totalDeductions = parseFloat((pf + esi + tax).toFixed(2));
  const netPay          = parseFloat((grossPay - totalDeductions).toFixed(2));

  return { basic, hra, allowances, bonus, grossPay, pf, esi, tax, totalDeductions, netPay };
}

// GET /api/payroll
const getAll = async (req, res) => {
  try {
    const { month } = req.query;
    const currentMonth = month || new Date().toISOString().slice(0, 7);
    const params = [req.user.company_id, currentMonth];

    let query = `
      SELECT p.*, u.name AS employee, e.department, e.position
      FROM payroll p
      JOIN employees e ON e.id = p.employee_id
      JOIN users u ON u.id = e.user_id
      WHERE p.company_id=$1 AND p.month=$2
      ORDER BY u.name
    `;

    if (req.user.role === 'employee') {
      const empRes = await pool.query('SELECT id FROM employees WHERE user_id=$1', [req.user.id]);
      if (!empRes.rows.length) return res.json({ payroll: [] });
      query = `
        SELECT p.*, u.name AS employee, e.department, e.position
        FROM payroll p
        JOIN employees e ON e.id = p.employee_id
        JOIN users u ON u.id = e.user_id
        WHERE p.employee_id=$1 ORDER BY p.month DESC
      `;
      params.splice(0, params.length, empRes.rows[0].id);
    }

    const result = await pool.query(query, params);

    // Enrich rows with computed fields for frontends that show gross/pf/esi
    const enriched = result.rows.map(p => {
      const basic      = parseFloat(p.basic      || 0);
      const hra        = parseFloat(p.hra        || 0);
      const allowances = parseFloat(p.allowances || 0);
      const bonus      = parseFloat(p.bonus      || 0);
      const tax        = parseFloat(p.tax        || 0);
      const deductions = parseFloat(p.deductions || 0);

      // Use stored columns when available; fall back to on-the-fly calculation
      const gross_pay = parseFloat(p.gross_pay || 0) || parseFloat((basic + hra + allowances + bonus).toFixed(2));
      const pf        = parseFloat(p.pf  || 0) || parseFloat(Math.min(basic * 0.12, 1800).toFixed(2));
      const esi       = parseFloat(p.esi || 0);
      const total_deductions = parseFloat(p.total_deductions || 0) || parseFloat((deductions + tax).toFixed(2));

      return { ...p, gross_pay, pf, esi, total_deductions };
    });

    res.json({ payroll: enriched, month: currentMonth });
  } catch (err) {
    console.error('getAll payroll error:', err);
    res.status(500).json({ message: 'Failed to fetch payroll' });
  }
};

// POST /api/payroll/run
const runPayroll = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { month } = req.body;
    const currentMonth = month || new Date().toISOString().slice(0, 7);
    const company_id = req.user.company_id;

    const employees = await client.query(
      'SELECT id, salary FROM employees WHERE company_id=$1 AND is_active=true',
      [company_id]
    );

    // Detect which optional columns exist in the payroll table
    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'payroll'
        AND column_name IN ('gross_pay','pf','esi','total_deductions')
    `);
    const extraCols = new Set(colCheck.rows.map(r => r.column_name));
    const hasExtra  = extraCols.size === 4;

    const created = [];
    for (const emp of employees.rows) {
      const c = calculateIndianPayroll(emp.salary || 0);

      let insertRes;
      if (hasExtra) {
        // New schema with extended Indian payroll columns
        insertRes = await client.query(
          `INSERT INTO payroll
             (employee_id, company_id, month,
              basic, hra, allowances, bonus,
              gross_pay, pf, esi, tax,
              total_deductions, deductions, net_pay)
           VALUES ($1,$2,$3, $4,$5,$6,$7, $8,$9,$10,$11, $12,$12,$13)
           ON CONFLICT (employee_id, month) DO NOTHING RETURNING *`,
          [
            emp.id, company_id, currentMonth,
            c.basic, c.hra, c.allowances, c.bonus,
            c.grossPay, c.pf, c.esi, c.tax,
            c.totalDeductions,
            c.netPay,
          ]
        );
      } else {
        // Original schema — works on unmodified DB
        insertRes = await client.query(
          `INSERT INTO payroll
             (employee_id, company_id, month,
              basic, hra, allowances, bonus,
              deductions, tax, net_pay)
           VALUES ($1,$2,$3, $4,$5,$6,$7, $8,$9,$10)
           ON CONFLICT (employee_id, month) DO NOTHING RETURNING *`,
          [
            emp.id, company_id, currentMonth,
            c.basic, c.hra, c.allowances, c.bonus,
            c.totalDeductions, c.tax, c.netPay,
          ]
        );
      }

      if (insertRes.rows.length) created.push(insertRes.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({
      message: `Payroll generated for ${created.length} employees`,
      month: currentMonth,
      count: created.length,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('runPayroll error:', err);
    res.status(500).json({ message: 'Failed to run payroll' });
  } finally {
    client.release();
  }
};

// PUT /api/payroll/:id/pay
const markPaid = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE payroll SET status='paid', paid_on=CURRENT_DATE, updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Payroll record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark as paid' });
  }
};

module.exports = { getAll, runPayroll, markPaid };
