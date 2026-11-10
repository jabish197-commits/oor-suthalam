import User from '../models/User.js';
import { verifySession } from '../utils/session.js';
import HttpError from '../utils/HttpError.js';
export default async function authenticate(req, _res, next) {
  let claims;
  try {
    claims = verifySession(req.cookies.session);
  } catch {
    throw new HttpError(401, 'Please sign in.');
  }
  const user = await User.findById(claims.sub);
  if (!user) throw new HttpError(401, 'Please sign in.');
  req.user = user;
  next();
}
