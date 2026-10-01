import { apiClient } from './apiClient';

export const notificationService = {
  // Get notifications for the logged-in user
  getMyNotifications: async () => {
    return apiClient.get('/api/notifications/me');
  },

  // Get one notification
  getById: async (id) => {
    return apiClient.get(`/api/notifications/${id}`);
  },

  // Mark one notification as read
  markAsRead: async (id) => {
    return apiClient.put(
      `/api/notifications/${id}/read`
    );
  },
};

export default notificationService;