// client/src/services/authService.js
import { api } from './api';

export const authService = {
  register: (body) => api('/auth/register', { method: 'POST', body }),
  login: (body) => api('/auth/login', { method: 'POST', body }),
  logout: () => api('/auth/logout', { method: 'POST' }),
  me: () => api('/auth/me'),
  updateProfile: (body) => api('/auth/me', { method: 'PATCH', body }),
  savedPlaces: () => api('/auth/saved'),
  savePlace: (id) => api(`/auth/saved/${id}`, { method: 'PUT' }),
  removeSavedPlace: (id) => api(`/auth/saved/${id}`, { method: 'DELETE' }),
  users: () => api('/auth/users'),
};
