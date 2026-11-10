// client/src/services/destinationService.js
import { api } from './api';

export const destinationService = {
  uploadImage: (file) => api('/destinations/image', { method: 'POST', body: file }),
  list: (query = '') => api(`/destinations${query ? `?${query}` : ''}`),
  detail: (id) => api(`/destinations/${id}`),
  create: (body) => api('/destinations', { method: 'POST', body }),
  update: (id, body) => api(`/destinations/${id}`, { method: 'PUT', body }),
  remove: (id) => api(`/destinations/${id}`, { method: 'DELETE' }),
};
