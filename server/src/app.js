import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'node:url';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import { uploadDirectory } from './controllers/imageController.js';

const app = express();
app.disable('x-powered-by');
const allowedOrigins = new Set(
  (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim()),
);
if (process.env.RENDER_EXTERNAL_URL) allowedOrigins.add(process.env.RENDER_EXTERNAL_URL);
if (process.env.NODE_ENV !== 'production') {
  for (const host of ['localhost', '127.0.0.1'])
    for (const port of [5173, 5174, 8080]) allowedOrigins.add(`http://${host}:${port}`);
}

app.set('allowedOrigins', allowedOrigins);

app.use(
  cors({
    origin: [...allowedOrigins],
    credentials: true,
  }),
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Cookie sessions use SameSite=Lax plus exact Origin checks for mutations.
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    req.headers.origin &&
    !allowedOrigins.has(req.headers.origin)
  ) {
    return res.status(403).json({ success: false, message: 'Origin is not allowed.' });
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Oor Suthalam API is running!',
  });
});

app.use(
  '/api/uploads',
  express.static(uploadDirectory, {
    index: false,
    dotfiles: 'deny',
    maxAge: '1d',
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  }),
);
app.use('/api', routes);
if (process.env.SERVE_FRONTEND === 'true') {
  const frontendDirectory = fileURLToPath(
    new URL('../../client/oor-suthalam/dist/', import.meta.url),
  );
  app.use(express.static(frontendDirectory));
  app.get('/{*path}', (req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/') || req.path.startsWith('/socket.io'))
      return next();
    if (!req.accepts('html')) return next();
    res.sendFile(`${frontendDirectory}index.html`);
  });
}
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found.' }),
);
app.use(errorHandler);
export default app;
