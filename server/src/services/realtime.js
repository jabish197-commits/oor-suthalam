import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import User from '../models/User.js';
import { verifySession } from '../utils/session.js';

export function attachRealtime(httpServer, app) {
  const origins = app.get('allowedOrigins');
  const io = new Server(httpServer, {
    path: '/api/socket.io',
    cors: { origin: [...origins], credentials: true },
    allowRequest: (req, done) =>
      done(null, !req.headers.origin || origins.has(req.headers.origin)),
  });
  io.use(async (socket, next) => {
    try {
      const cookies = cookieParser.JSONCookies(
        Object.fromEntries(
          (socket.request.headers.cookie || '')
            .split(';')
            .filter(Boolean)
            .map((part) => {
              const index = part.indexOf('=');
              return [
                part.slice(0, index).trim(),
                decodeURIComponent(part.slice(index + 1)),
              ];
            }),
        ),
      );
      const claims = verifySession(cookies.session);
      const user = await User.findById(claims.sub);
      if (user?.role !== 'admin') throw new Error();
      socket.data.expires = claims.exp * 1000;
      next();
    } catch {
      next(new Error('Administrator session required.'));
    }
  });
  io.on('connection', (socket) => {
    socket.join('admin-messages');
    const timer = setTimeout(
      () => socket.disconnect(true),
      Math.min(socket.data.expires - Date.now(), 2147483647),
    );
    socket.on('disconnect', () => clearTimeout(timer));
  });
  app.set('realtime', io);
  return io;
}
