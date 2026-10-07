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
      `/api/notifications/${id}/read`,
      { is_read: true }
    );
  },

  // Get unread notification count
  getUnreadCount: async () => {
    return apiClient.get('/api/notifications/unread-count');
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return apiClient.put('/api/notifications/mark-all-read');
  },
};

export default notificationService;