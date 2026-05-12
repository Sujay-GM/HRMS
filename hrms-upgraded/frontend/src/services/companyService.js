import api from './api';

export const companyService = {
  getAll:   (params) => api.get('/companies', { params }),
  getById:  (id)     => api.get(`/companies/${id}`),
  create:   (data)   => api.post('/companies', data),
  update:   (id, d)  => api.put(`/companies/${id}`, d),
  delete:   (id)     => api.delete(`/companies/${id}`),
  getStats: (id)     => api.get(`/companies/${id}/stats`),
};
