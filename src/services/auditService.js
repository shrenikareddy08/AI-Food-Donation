import { apiClient } from './apiClient';

export const auditService = {
  getAll: () => apiClient.get('/api/audit-logs'),
  getById: (id) => apiClient.get(`/api/audit-logs/${id}`),
  create: (data) => apiClient.post('/api/audit-logs', data),
  delete: (id) => apiClient.delete(`/api/audit-logs/${id}`),
};
