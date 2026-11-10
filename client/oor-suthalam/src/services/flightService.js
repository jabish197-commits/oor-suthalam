import { api } from './api';
export const flightService = {
  list: () => api('/flights'),
  create: (body) => api('/flights', { method: 'POST', body }),
  update: (id, status) =>
    api(`/flights/${id}/status`, { method: 'PATCH', body: { status } }),
};
