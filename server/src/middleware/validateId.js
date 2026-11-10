import { id } from '../validators/index.js';
import HttpError from '../utils/HttpError.js';

export default function validateId(_req, _res, next, value) {
  if (!id(value)) return next(new HttpError(400, 'Invalid resource ID.'));
  next();
}
