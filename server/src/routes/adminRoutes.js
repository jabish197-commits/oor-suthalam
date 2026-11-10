import { adminAssistant } from '../controllers/adminAssistantController.js';
import rateLimit from '../middleware/rateLimit.js';
import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import { overview } from '../controllers/adminController.js';

const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/overview', overview);
router.post('/assistant', rateLimit('admin-assistant', 30), adminAssistant);
export default router;
