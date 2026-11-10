import { api } from './api';

export const adminService = {
  overview: () => api('/admin/overview'),
};
