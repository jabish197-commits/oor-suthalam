import { Router, raw } from 'express';
import { randomUUID } from 'node:crypto';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import SiteSettings from '../models/SiteSettings.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import rateLimit from '../middleware/rateLimit.js';
import HttpError from '../utils/HttpError.js';
import { uploadDirectory } from '../controllers/imageController.js';
import { validateMp4 } from '../services/videoUploadService.js';
const router = Router();
export const defaultHero = {
  heroVideo: '/videos/sunny-coast.mp4',
  heroPoster: '/images/sunny-coast.jpg',
};
router.get('/', async (_req, res) => {
  const value = await SiteSettings.findOne({ key: 'homepage' });
  res
    .set('Cache-Control', 'no-store')
    .json({
      heroVideo: value?.heroVideo || defaultHero.heroVideo,
      heroPoster: value?.heroVideo
        ? value.heroPoster || ''
        : value?.heroPoster || defaultHero.heroPoster,
    });
});
router.use(authenticate, authorize('admin'));
router.post(
  '/video',
  rateLimit('hero-video-upload', 10),
  raw({ type: 'video/mp4', limit: '30mb' }),
  async (req, res) => {
    validateMp4(req.body);
    await mkdir(uploadDirectory, { recursive: true });
    const filename = `${randomUUID()}.mp4`;
    await writeFile(join(uploadDirectory, filename), req.body, { flag: 'wx' });
    res.status(201).json({ video: `/api/uploads/${filename}` });
  },
);
router.put('/', async (req, res) => {
  const { heroVideo, heroPoster = '' } = req.body || {};
  if (typeof heroVideo !== 'string' || typeof heroPoster !== 'string')
    throw new HttpError(400, 'Choose a banner video and optional cover photo.');
  const videoPattern = /^\/api\/uploads\/[a-f0-9-]{36}\.mp4$/;
  const photoPattern = /^\/api\/uploads\/[a-f0-9-]{36}\.webp$/;
  if (
    heroVideo !== '' &&
    heroVideo !== defaultHero.heroVideo &&
    !videoPattern.test(heroVideo)
  )
    throw new HttpError(400, 'Upload a video from this admin workspace.');
  if (
    heroPoster !== '' &&
    heroPoster !== defaultHero.heroPoster &&
    !photoPattern.test(heroPoster)
  )
    throw new HttpError(400, 'Upload a valid cover photo.');
  for (const value of [heroVideo, heroPoster].filter((v) =>
    v.startsWith('/api/uploads/'),
  )) {
    try {
      await access(join(uploadDirectory, value.split('/').at(-1)));
    } catch {
      throw new HttpError(
        400,
        'An uploaded media file is missing. Please upload it again.',
      );
    }
  }
  await SiteSettings.findOneAndUpdate(
    { key: 'homepage' },
    {
      $set: {
        heroVideo: heroVideo === defaultHero.heroVideo ? '' : heroVideo,
        heroPoster,
      },
    },
    { upsert: true, runValidators: true, returnDocument: 'after' },
  );
  res.json({ success: true, message: 'Homepage video saved successfully.' });
});
export default router;
