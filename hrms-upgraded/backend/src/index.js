const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'HRMS API is running', timestamp: new Date().toISOString() });
});

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/companies',  require('./routes/companies'));
app.use('/api/employees',  require('./routes/employees'));
app.use('/api/admins',     require('./routes/admins'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/leaves',     require('./routes/leaves'));
app.use('/api/payroll',    require('./routes/payroll'));
app.use('/api/dashboard',  require('./routes/dashboard'));

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ────────────────────────────────────
app.use(require('./middleware/errorHandler'));

// ── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║        HRMS API Server Started           ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  URL  : http://localhost:${PORT}           ║`);
  console.log(`║  ENV  : ${process.env.NODE_ENV || 'development'}                      ║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
