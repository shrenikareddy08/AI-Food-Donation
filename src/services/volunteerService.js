import { apiClient } from './apiClient';

export const volunteerService = {
  getAll: () => apiClient.get('/api/volunteers'),
  getById: (id) => apiClient.get(`/api/volunteers/${id}`),
  create: (data) => apiClient.post('/api/volunteers', data),
  delete: (id) => apiClient.delete(`/api/volunteers/${id}`),
};
