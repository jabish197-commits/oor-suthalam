import { safeRedirect } from './format.js';
export function loginRedirect(role, previousPath) {
  if (role === 'admin') {
    const target = safeRedirect(previousPath, '/admin');
    return /^\/admin(?:\/|[?#]|$)/.test(target) ? target : '/admin';
  }
  const target = safeRedirect(previousPath, '/');
  return /^\/admin(?:\/|[?#]|$)/.test(target) ? '/' : target;
}
