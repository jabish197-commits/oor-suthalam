import Booking from '../models/Booking.js';
import { quoteHandlers } from '../controllers/quoteController.js';
import { Router } from 'express';
import * as c from '../controllers/bookingController.js';
import authenticate from '../middleware/authenticate.js';
import validate from '../middleware/validate.js';
import { schemas } from '../validators/index.js';
import validateId from '../middleware/validateId.js';
import authorize from '../middleware/authorize.js';
const router = Router();
router.param('id', validateId);
router.use(authenticate);
router.get('/', c.list);
router.post('/', validate(schemas.booking), c.create);
router.patch('/:id/status', validate(schemas.status), c.update);
router.post('/:id/change', validate(schemas.bookingChange), c.requestChange);
router.patch(
  '/:id/change',
  authorize('admin'),
  validate(schemas.changeDecision),
  c.reviewChange,
);
const quotes = quoteHandlers(Booking, { booking: true });
router.post('/:id/quote', authorize('admin'), validate(schemas.quoteOffer), quotes.offer);
router.post('/:id/quote/respond', validate(schemas.quoteResponse), quotes.respond);
export default router;
