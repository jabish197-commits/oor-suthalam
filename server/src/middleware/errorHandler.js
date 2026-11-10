import HttpError from '../utils/HttpError.js';
export default function errorHandler(error, req, res, _next) {
  let status = error.status || 500;
  let message =
    status < 500 || (error instanceof HttpError && error.expose === true)
      ? error.message
      : 'Something went wrong. Please try again.';
  if (error.code === 11000) {
    status = 409;
    message = 'This email is already registered.';
  }
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    status = 400;
    message = 'Invalid request data.';
  }
  if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON.';
  }
  if (error.type === 'entity.too.large') {
    status = 413;
    message = req.originalUrl?.includes('/site-settings/video')
      ? 'Video is too large. Choose an MP4 up to 30 MB.'
      : 'File or request is too large. Photos must be 5 MB or smaller.';
  }
  res.status(status).json({ success: false, message });
}
