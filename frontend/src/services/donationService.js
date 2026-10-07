import { apiClient } from './apiClient';

export const donationService = {

  // Get all donations available to the logged-in user
  getAll: async () => {
    return apiClient.get('/api/donations/');
  },

  // Get one donation by ID
  getById: async (id) => {
    return apiClient.get(`/api/donations/${id}`);
  },

  // Create a new donation
  create: async (data) => {
    return apiClient.post('/api/donations/', data);
  },

  // Update an existing donation
  update: async (id, data) => {
    return apiClient.put(`/api/donations/${id}`, data);
  },

  // Delete a donation
  delete: async (id) => {
    return apiClient.delete(`/api/donations/${id}`);
  },

};

export default donationService;