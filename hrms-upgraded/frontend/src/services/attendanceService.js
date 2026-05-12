import api from './api';

export const attendanceService = {
  getAll:     (params) => api.get('/attendance', { params }),
  getMe:      (params) => api.get('/attendance/me', { params }),
  getToday:   ()       => api.get('/attendance/today'),
  getReport:  (params) => api.get('/attendance/report', { params }),
  checkIn:    (data)   => api.post('/attendance/check-in', data || {}),
  checkOut:   ()       => api.post('/attendance/check-out', {}),
};
