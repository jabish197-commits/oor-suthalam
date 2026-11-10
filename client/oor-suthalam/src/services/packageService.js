import { api } from './api';

export const packageService = {
  list: () => api('/packages'),
  detail: (id) => api(`/packages/${id}`),
  create: (body) => api('/packages', { method: 'POST', body }),
  update: (id, body) => api(`/packages/${id}`, { method: 'PUT', body }),
  remove: (id) => api(`/packages/${id}`, { method: 'DELETE' }),
};
