import { apiClient } from './apiClient';

export const eventService = {
  getEvents: async (statusFilter = null) => {
    const url = statusFilter ? `/api/events?status_filter=${statusFilter}` : '/api/events';
    return await apiClient.get(url);
  },

  getEvent: async (eventId) => {
    return await apiClient.get(`/api/events/${eventId}`);
  },

  createEvent: async (data) => {
    return await apiClient.post('/api/events', data);
  },

  declareLeftovers: async (eventId, data) => {
    return await apiClient.post(`/api/events/${eventId}/declare-leftovers`, data);
  },

  convertToDonation: async (eventId, data = {}) => {
    return await apiClient.post(`/api/events/${eventId}/convert-to-donation`, data);
  },
};
