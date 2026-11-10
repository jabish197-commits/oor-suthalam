// Explicitly targets the local development catalog; preserves uploaded gallery photos.
import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import sharp from 'sharp';
import Destination from '../src/models/Destination.js';

const aliases = {
  Mamallapuram: 'mahabalipuram',
  Tiruchirappalli: 'tiruchi',
  Tharangambadi: 'tranquebar',
  Courtallam: 'kutralam',
  Thanjavur: 'thanjevur',
  Tiruvannamalai: 'thiruvannamalai',
  Alappuzha: 'alleppey',
  Kochi: 'kochi',
  Thiruvananthapuram: 'trivandrum',
  Athirappilly: 'athirapally',
};
const report = JSON.parse(
  await fs.readFile('../docs/destination-photo-import.json', 'utf8'),
);
await mongoose.connect('mongodb://127.0.0.1:27017/oor_suthalam_local', {
  serverSelectionTimeoutMS: 10000,
});
try {
  const places = await Destination.find({
    active: { $ne: false },
    region: /Tamil Nadu|Kerala/i,
  }).sort({ name: 1 });
  for (const place of places) {
    if (place.gallery.filter((p) => p.image).length > 1) {
      report.push({
        name: place.name,
        status: 'preserved existing gallery',
        photos: place.gallery.length,
      });
      continue;
    }
    const slug = aliases[place.name] || place.name.toLowerCase().replaceAll(' ', '-');
    const source =
      {
        Courtallam:
          'https://www.holidify.com/places/kanyakumari/courtallam-falls-sightseeing-2268.html',
        Pichavaram:
          'https://www.holidify.com/places/chidambram/pichavaram-backwaters-and-mangrove-forests-sightseeing-4364.html',
        Tiruchendur:
          'https://www.holidify.com/places/tuticorin/tiruchendur-sri-subrahmanya-swami-devasthanam-sightseeing-6084.html',
        Athirappilly:
          'https://www.holidify.com/places/thrissur/athirapally-falls-sightseeing-3769.html',
      }[place.name] || `https://www.holidify.com/places/${slug}/photos.html`;
    try {
      const response = await fetch(source, { signal: AbortSignal.timeout(18000) });
      if (!response.ok) throw Error(`Gallery unavailable: ${response.status}`);
      const html = await response.text();
      const photos = [];
      for (const block of html.split('class="image-slick-slider-wrapper"').slice(1)) {
        const url = block.match(/data-original="([^"]+)"/)?.[1];
        const title = block.match(/class="image-title">\s*([^<]+)/)?.[1]?.trim();
        if (url && title && !photos.some((p) => p.title === title))
          photos.push({ url, title });
      }
      if (!photos.length) {
        for (const match of html.matchAll(
          /class="lazyBG swipe-image" data-original="([^"]+)"/g,
        )) {
          if (/map|logo|retro-antique/i.test(match[1])) continue;
          photos.push({
            url: match[1],
            title: place.name + ' · view ' + (photos.length + 1),
          });
        }
      }
      if (!photos.length) throw Error('No attraction photos found');
      await fs.mkdir(`../client/oor-suthalam/public/images/destinations/${slug}`, {
        recursive: true,
      });
      const gallery = [];
      for (const [index, photo] of photos.slice(0, 12).entries()) {
        try {
          const response = await fetch(photo.url, { signal: AbortSignal.timeout(12000) });
          if (!response.ok) throw Error('Photo unavailable');
          const image = `/images/destinations/${slug}/attraction-${index + 1}.webp`;
          await sharp(Buffer.from(await response.arrayBuffer()))
            .resize({ width: 960, withoutEnlargement: true })
            .webp({ quality: 76 })
            .toFile('../client/oor-suthalam/public' + image);
          gallery.push({
            title: photo.title,
            image,
            caption: `Photo reference: Holidify ${place.name} gallery.`,
          });
          photo.local = image;
        } catch (error) {
          photo.error = error.message;
        }
      }
      if (gallery.length) {
        const existing = place.gallery.filter((p) => p.image);
        place.gallery = [
          ...existing,
          ...gallery.filter((p) => !existing.some((e) => e.title === p.title)),
        ].slice(0, 20);
        place.galleryConfigured = true;
        await place.save();
      }
      report.push({ name: place.name, source, photos: gallery.length, items: photos });
      console.log(`${place.name}: ${gallery.length} photos`);
    } catch (error) {
      report.push({ name: place.name, source, error: error.message });
      console.log(`${place.name}: ${error.message}`);
    }
    await fs.writeFile(
      '../docs/destination-photo-import.json',
      JSON.stringify(report, null, 2),
    );
  }
} finally {
  await mongoose.disconnect();
}
