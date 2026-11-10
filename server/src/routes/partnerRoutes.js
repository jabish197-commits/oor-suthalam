import { Router } from 'express';
import * as controller from '../controllers/partnerController.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import validateId from '../middleware/validateId.js';
import { schemas } from '../validators/index.js';
const router = Router();
router.param('id', validateId);
router.get('/directory', controller.directory);
router.use(authenticate);
router.get('/me', controller.mine);
router.post('/apply', validate(schemas.partner), controller.apply);
router.get('/assignments', controller.assignments);
router.patch(
  '/assignments/:id/response',
  validate(schemas.partnerResponse),
  controller.respond,
);
router.use(authorize('admin'));
router.get('/', controller.list);
router.patch('/:id/status', validate(schemas.partnerDecision), controller.review);
router.post('/:id/assign', validate(schemas.assignment), controller.assign);
export default router;
