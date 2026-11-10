import HttpError from '../utils/HttpError.js';
export default (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user?.role))
      throw new HttpError(403, 'You do not have permission.');
    next();
  };
