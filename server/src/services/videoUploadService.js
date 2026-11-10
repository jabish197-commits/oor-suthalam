import HttpError from '../utils/HttpError.js';
// Validate MP4 box boundaries and require both video metadata and media data.
export function validateMp4(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 32 || buffer.length > 30 * 1024 * 1024)
    throw new HttpError(400, 'Choose an MP4 video up to 30 MB.');
  let offset = 0;
  const found = new Set();
  while (offset + 8 <= buffer.length) {
    let size = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    let header = 8;
    if (size === 1) {
      if (offset + 16 > buffer.length) throw new HttpError(400, 'Invalid MP4 file.');
      const large = buffer.readBigUInt64BE(offset + 8);
      if (large > BigInt(buffer.length)) throw new HttpError(400, 'Invalid MP4 file.');
      size = Number(large);
      header = 16;
    }
    if (size === 0) size = buffer.length - offset;
    if (size < header || offset + size > buffer.length)
      throw new HttpError(400, 'Invalid MP4 file.');
    if (offset === 0 && type !== 'ftyp')
      throw new HttpError(400, 'Choose a valid MP4 video, preferably H.264.');
    found.add(type);
    offset += size;
  }
  if (
    offset !== buffer.length ||
    !['ftyp', 'moov', 'mdat'].every((type) => found.has(type))
  )
    throw new HttpError(400, 'The MP4 is incomplete or missing video data.');
}
