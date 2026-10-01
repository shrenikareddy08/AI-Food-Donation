import { apiClient } from './apiClient';

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });

  const result = query.toString();
  return result ? `?${result}` : '';
}

export const ngoService = {
  getAll: () => apiClient.get('/api/ngos'),

  getById: (id) => apiClient.get(`/api/ngos/${id}`),

  create: (data) => apiClient.post('/api/ngos', data),

  delete: (id) => apiClient.delete(`/api/ngos/${id}`),

  getNearby: async ({
    latitude,
    longitude,
    radiusKm = 10,
  }) => {
    try {
      return await apiClient.get(
        `/api/ngos/nearby/search${buildQuery({
          latitude,
          longitude,
          radius_km: radiusKm,
        })}`
      );
    } catch {
      // Fallback to the complete NGO list.
      // The frontend can then calculate distance itself.
      return apiClient.get('/api/ngos');
    }
  },
};