import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useResource from '../hooks/useResource';
import { api } from '../services/api';

const MessagesContext = createContext(null);
export const useAdminMessages = () => useContext(MessagesContext);
export function AdminMessagesProvider({ children }) {
  const resource = useResource(() => api('/inquiries'), '', { keepPreviousData: true });
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || '/api';
    const origin = new URL(base, window.location.origin).origin;
    const socket = io(origin, { path: '/api/socket.io', withCredentials: true });
    socket.on('connect', () => {
      setConnected(true);
      resource.reload();
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('inquiries:updated', resource.reload);
    const refreshOnFocus = () => resource.reload();
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      socket.disconnect();
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [resource.reload]);
  return (
    <MessagesContext.Provider
      value={{
        resource,
        connected,
        unread: (resource.data || []).filter((item) => !item.readAt).length,
        markRead: async (id) => {
          await api('/inquiries/' + id + '/read', { method: 'PATCH' });
          resource.reload();
        },
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}
