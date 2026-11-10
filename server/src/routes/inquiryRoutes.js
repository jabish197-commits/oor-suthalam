import validateId from '../middleware/validateId.js';
import { Router } from 'express';
import * as c from '../controllers/inquiryController.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import rateLimit from '../middleware/rateLimit.js';
import { schemas } from '../validators/index.js';
const router = Router();
router.param('id', validateId);
router.post('/', rateLimit('inquiry', 10), validate(schemas.inquiry), c.create);
router.get('/', authenticate, authorize('admin'), c.list);
router.get('/email-status', authenticate, authorize('admin'), c.emailStatus);
router.patch('/:id/read', authenticate, authorize('admin'), c.markRead);
router.get('/:id/replies', authenticate, authorize('admin'), c.replies);
router.post(
  '/:id/replies',
  authenticate,
  authorize('admin'),
  rateLimit('email-reply', 20),
  validate(schemas.inquiryReply),
  c.reply,
);
export default router;
