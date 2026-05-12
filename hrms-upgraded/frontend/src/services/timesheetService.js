// frontend/src/services/timesheetService.js
// Timesheet API service for Gully HR
// Currently uses localStorage for persistence (no backend required).
// To connect to the real API, uncomment the api.* calls and remove localStorage logic.

import api from './api';

// ─── Toggle this to switch between localStorage and real API ─────────────────
const USE_API = false; // set to true when backend timesheet routes are mounted

const LS_KEY = 'gully_hr_timesheets';

const ls = {
  load: () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } },
  save: (d) => localStorage.setItem(LS_KEY, JSON.stringify(d)),
};

let _id = Date.now();

export const timesheetService = {
  // ── Employee ──────────────────────────────────────────────────────────────

  getMyEntries: (params = {}) => {
    if (USE_API) return api.get('/timesheets/my', { params });
    const all = ls.load();
    let entries = [...all];
    if (params.month) entries = entries.filter(e => e.date.startsWith(params.month));
    return Promise.resolve({ data: { entries, totalHours: entries.reduce((s, e) => s + (e.hours || 0), 0) } });
  },

  create: (data) => {
    if (USE_API) return api.post('/timesheets', data);
    const entry = { id: ++_id, ...data, approvalStatus: 'pending', createdAt: new Date().toISOString() };
    ls.save([entry, ...ls.load()]);
    return Promise.resolve({ data: { entry } });
  },

  update: (id, data) => {
    if (USE_API) return api.put(`/timesheets/${id}`, data);
    const all = ls.load().map(e => e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e);
    ls.save(all);
    return Promise.resolve({ data: { entry: all.find(e => e.id === id) } });
  },

  remove: (id) => {
    if (USE_API) return api.delete(`/timesheets/${id}`);
    ls.save(ls.load().filter(e => e.id !== id));
    return Promise.resolve({ data: { message: 'Deleted' } });
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  adminGetAll: (params = {}) => {
    if (USE_API) return api.get('/timesheets/admin/all', { params });
    const all = ls.load();
    return Promise.resolve({ data: { entries: all, total: all.length, totalHours: all.reduce((s, e) => s + (e.hours || 0), 0) } });
  },

  approve: (id) => {
    if (USE_API) return api.patch(`/timesheets/admin/${id}/approve`);
    const all = ls.load().map(e => e.id === id ? { ...e, approvalStatus: 'approved', reviewedAt: new Date().toISOString() } : e);
    ls.save(all);
    return Promise.resolve({ data: { entry: all.find(e => e.id === id) } });
  },

  reject: (id, reviewNote) => {
    if (USE_API) return api.patch(`/timesheets/admin/${id}/reject`, { reviewNote });
    const all = ls.load().map(e => e.id === id ? { ...e, approvalStatus: 'rejected', reviewNote, reviewedAt: new Date().toISOString() } : e);
    ls.save(all);
    return Promise.resolve({ data: { entry: all.find(e => e.id === id) } });
  },

  bulkApprove: (ids) => {
    if (USE_API) return api.patch('/timesheets/admin/bulk-approve', { ids });
    const all = ls.load().map(e => ids.includes(e.id) ? { ...e, approvalStatus: 'approved', reviewedAt: new Date().toISOString() } : e);
    ls.save(all);
    return Promise.resolve({ data: { updated: ids.length } });
  },
};
