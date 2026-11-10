import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import HttpError from '../utils/HttpError.js';

export const uploadDirectory = fileURLToPath(new URL('../../uploads/', import.meta.url));
export async function uploadImage(req, res) {
  if (!Buffer.isBuffer(req.body) || !req.body.length)
    throw new HttpError(400, 'Choose a JPEG, PNG or WebP photo.');
  let output;
  try {
    const decoder = sharp(req.body, { limitInputPixels: 25000000, animated: false });
    const metadata = await decoder.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format))
      throw new Error('Unsupported image');
    output = await decoder
      .rotate()
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new HttpError(
      400,
      'Invalid photo. Choose a JPEG, PNG or WebP image up to 5 MB and 25 megapixels.',
    );
  }
  await mkdir(uploadDirectory, { recursive: true });
  const filename = `${randomUUID()}.webp`;
  await writeFile(`${uploadDirectory}/${filename}`, output, { flag: 'wx' });
  res.status(201).json({ image: `/api/uploads/${filename}` });
}
