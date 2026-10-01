import { apiClient } from './apiClient';

export const matchService = {
  getAll: () => apiClient.get('/api/matches'),
  getById: (id) => apiClient.get(`/api/matches/${id}`),
  create: (data) => apiClient.post('/api/matches', data),
  delete: (id) => apiClient.delete(`/api/matches/${id}`),
};
