// backend/src/routes/timesheets.js
// Timesheet routes for Gully HR
// Requires auth middleware. Mount at /api/timesheets

import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ─── Employee: Get my timesheet entries ───────────────────────────────────────
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { weekStart, weekEnd, month } = req.query;
    const employeeId = req.user.employee?.id;
    if (!employeeId) return res.status(403).json({ message: 'Employee profile not found' });

    const where = { employeeId };
    if (weekStart && weekEnd) {
      where.date = { gte: new Date(weekStart), lte: new Date(weekEnd) };
    } else if (month) {
      const [y, m] = month.split('-').map(Number);
      where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }

    const entries = await prisma.timesheetEntry.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    const totalHours = entries.reduce((s, e) => s + Number(e.hours), 0);
    res.json({ entries, totalHours });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Employee: Create entry ────────────────────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const employeeId = req.user.employee?.id;
    const companyId = req.user.companyId;
    if (!employeeId) return res.status(403).json({ message: 'Employee profile not found' });

    const { date, startTime, endTime, hours, taskTitle, description, project, category, status } = req.body;
    if (!date || !startTime || !endTime || !taskTitle) {
      return res.status(400).json({ message: 'date, startTime, endTime, taskTitle are required' });
    }

    const entry = await prisma.timesheetEntry.create({
      data: {
        employeeId, companyId,
        date: new Date(date),
        startTime, endTime,
        hours: hours || 0,
        taskTitle, description, project,
        category: category || 'Development',
        status: status || 'completed',
        approvalStatus: 'pending',
      },
    });

    res.status(201).json({ entry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Employee: Update own entry ───────────────────────────────────────────────
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const employeeId = req.user.employee?.id;
    const entry = await prisma.timesheetEntry.findUnique({ where: { id: Number(req.params.id) } });
    if (!entry || entry.employeeId !== employeeId) return res.status(403).json({ message: 'Not authorized' });
    if (entry.approvalStatus === 'approved') return res.status(400).json({ message: 'Cannot edit an approved entry' });

    const { date, startTime, endTime, hours, taskTitle, description, project, category, status } = req.body;
    const updated = await prisma.timesheetEntry.update({
      where: { id: Number(req.params.id) },
      data: { date: date ? new Date(date) : undefined, startTime, endTime, hours, taskTitle, description, project, category, status, approvalStatus: 'pending' },
    });
    res.json({ entry: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Employee: Delete own entry ───────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const employeeId = req.user.employee?.id;
    const entry = await prisma.timesheetEntry.findUnique({ where: { id: Number(req.params.id) } });
    if (!entry || entry.employeeId !== employeeId) return res.status(403).json({ message: 'Not authorized' });
    if (entry.approvalStatus === 'approved') return res.status(400).json({ message: 'Cannot delete an approved entry' });
    await prisma.timesheetEntry.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Admin: View all company timesheets ───────────────────────────────────────
router.get('/admin/all', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { employeeId, month, approvalStatus, page = 1, limit = 50 } = req.query;
    const companyId = req.user.companyId;

    const where = { companyId };
    if (employeeId) where.employeeId = Number(employeeId);
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }

    const [entries, total] = await Promise.all([
      prisma.timesheetEntry.findMany({
        where,
        include: { employee: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.timesheetEntry.count({ where }),
    ]);

    const totalHours = entries.reduce((s, e) => s + Number(e.hours), 0);
    res.json({ entries, total, totalHours, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Admin: Approve entry ─────────────────────────────────────────────────────
router.patch('/admin/:id/approve', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const updated = await prisma.timesheetEntry.update({
      where: { id: Number(req.params.id) },
      data: { approvalStatus: 'approved', reviewedBy: req.user.id, reviewedAt: new Date(), reviewNote: null },
    });
    res.json({ entry: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Admin: Reject entry ──────────────────────────────────────────────────────
router.patch('/admin/:id/reject', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { reviewNote } = req.body;
    const updated = await prisma.timesheetEntry.update({
      where: { id: Number(req.params.id) },
      data: { approvalStatus: 'rejected', reviewedBy: req.user.id, reviewedAt: new Date(), reviewNote },
    });
    res.json({ entry: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Admin: Bulk approve ──────────────────────────────────────────────────────
router.patch('/admin/bulk-approve', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'ids array required' });
    const result = await prisma.timesheetEntry.updateMany({
      where: { id: { in: ids }, companyId: req.user.companyId },
      data: { approvalStatus: 'approved', reviewedBy: req.user.id, reviewedAt: new Date() },
    });
    res.json({ updated: result.count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
