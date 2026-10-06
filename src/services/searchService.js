import { apiClient } from './apiClient';

export const searchService = {
  semanticSearch: async (query, entityType = 'ALL', limit = 10, userCoords = null) => {
    let url = `/api/search/semantic?q=${encodeURIComponent(query)}&entity_type=${entityType}&limit=${limit}`;
    if (userCoords?.latitude && userCoords?.longitude) {
      url += `&user_lat=${userCoords.latitude}&user_lon=${userCoords.longitude}`;
    }
    return await apiClient.get(url);
  },

  queryRagAssistant: async (question, topK = 3) => {
    return await apiClient.post('/api/rag/query', {
      question,
      top_k: topK,
    });
  },
};
