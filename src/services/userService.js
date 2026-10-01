import { apiClient } from './apiClient';

export const userService = {
  getAll: () => apiClient.get('/api/users'),
  getById: (id) => apiClient.get(`/api/users/${id}`),
  create: (data) => apiClient.post('/api/users', data),
  delete: (id) => apiClient.delete(`/api/users/${id}`),
};
