import { Router } from 'express';
import express from 'express';
import { uploadImage } from '../controllers/imageController.js';
import * as c from '../controllers/destinationController.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { schemas } from '../validators/index.js';
import validateId from '../middleware/validateId.js';
const router = Router();
router.param('id', validateId);
router.get('/', c.list);
router.get('/:id', c.detail);
router.use(authenticate, authorize('admin'));
router.post(
  '/image',
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }),
  uploadImage,
);
router.post('/', validate(schemas.destination), c.create);
router.put('/:id/gallery', validate(schemas.destinationGallery), c.updateGallery);
router.put('/:id', validate(schemas.destination), c.update);
router.delete('/:id', c.remove);
export default router;
