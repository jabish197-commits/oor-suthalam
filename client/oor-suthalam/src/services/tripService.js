import { api } from './api';

export const tripService = {
  list: () => api('/trips'),
  detail: (id) => api(`/trips/${id}`),
  create: (body) => api('/trips', { method: 'POST', body }),
  remove: (id) => api(`/trips/${id}`, { method: 'DELETE' }),
};
