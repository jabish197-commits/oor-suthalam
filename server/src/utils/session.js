import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';

if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
) {
  throw new Error('Set JWT_SECRET to at least 32 characters in production.');
}
// A missing development secret produces sessions valid only until the server restarts.
const secret = process.env.JWT_SECRET || randomBytes(48).toString('hex');
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};
export function setSession(res, user) {
  res.cookie(
    'session',
    jwt.sign({ sub: String(user._id) }, secret, { expiresIn: '30d', algorithm: 'HS256' }),
    {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  );
}
export function clearSession(res) {
  res.clearCookie('session', cookieOptions);
}
export function verifySession(token) {
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}
