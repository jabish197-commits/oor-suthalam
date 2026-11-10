import { api } from './api';

export const bookingService = {
  list: () => api('/bookings'),
  create: (body) => api('/bookings', { method: 'POST', body }),
  updateStatus: (id, status) =>
    api(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),
};
