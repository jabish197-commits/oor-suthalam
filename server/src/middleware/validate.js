import { validateObject } from '../validators/index.js';
export default (schema) => (req, _res, next) => {
  try {
    req.validated = validateObject(schema, req.body);
    next();
  } catch (error) {
    next(error);
  }
};
