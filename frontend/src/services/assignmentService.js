import { apiClient } from './apiClient';

export const assignmentService = {
  getAll: () => apiClient.get('/api/assignments'),
  getById: (id) => apiClient.get(`/api/assignments/${id}`),
  create: (data) => apiClient.post('/api/assignments', data),
  delete: (id) => apiClient.delete(`/api/assignments/${id}`),
};
