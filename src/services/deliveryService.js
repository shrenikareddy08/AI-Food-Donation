import { apiClient } from './apiClient';

export const deliveryService = {
  getAll: () => apiClient.get('/api/delivery-confirmations'),
  getById: (id) => apiClient.get(`/api/delivery-confirmations/${id}`),
  create: (data) => apiClient.post('/api/delivery-confirmations', data),
  delete: (id) => apiClient.delete(`/api/delivery-confirmations/${id}`),
};
