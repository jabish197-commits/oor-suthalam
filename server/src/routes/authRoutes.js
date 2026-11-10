import { Router } from 'express';
import * as c from '../controllers/authController.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import rateLimit from '../middleware/rateLimit.js';
import { schemas } from '../validators/index.js';
import validateId from '../middleware/validateId.js';
const router = Router();
router.param('id', validateId);
router.post(
  '/register',
  rateLimit('register', 10),
  validate(schemas.register),
  c.register,
);
router.post('/login', rateLimit('login', 30), validate(schemas.login), c.login);
router.post('/logout', c.logout);
router.use(authenticate);
router.get('/me', c.me);
router.patch('/me', validate(schemas.profile), c.profile);
router.get('/saved', c.saved);
router.put('/saved/:id', c.savePlace);
router.delete('/saved/:id', c.removePlace);
router.get('/users', authorize('admin'), c.users);
export default router;
