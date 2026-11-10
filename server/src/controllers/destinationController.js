import Destination from '../models/Destination.js';
import Package from '../models/Package.js';
import Trip from '../models/Trip.js';
import HttpError from '../utils/HttpError.js';
export async function list(req, res) {
  const filter = { active: { $ne: false }, region: /Tamil Nadu|Kerala/i };
  if (req.query.hidden === 'true') filter.hiddenGem = true;
  if (typeof req.query.category === 'string' && req.query.category)
    filter.category = req.query.category;
  if (typeof req.query.q === 'string' && req.query.q) {
    const escaped = req.query.q.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: new RegExp(escaped, 'i') },
      { region: new RegExp(escaped, 'i') },
    ];
  }
  res.json(await Destination.find(filter).sort({ name: 1 }).limit(200));
}
export async function detail(req, res) {
  const value = await Destination.findById(req.params.id);
  if (!value || value.active === false || !/Tamil Nadu|Kerala/i.test(value.region))
    throw new HttpError(404, 'Destination not found.');
  res.json(value);
}
export async function create(req, res) {
  res.status(201).json(await Destination.create(req.validated));
}
export async function update(req, res) {
  const value = await Destination.findByIdAndUpdate(req.params.id, req.validated, {
    new: true,
    runValidators: true,
  });
  if (!value) throw new HttpError(404, 'Destination not found.');
  res.json(value);
}
export async function remove(req, res) {
  if (
    (await Package.exists({ destination: req.params.id })) ||
    (await Trip.exists({ destination: req.params.id }))
  )
    throw new HttpError(409, 'This destination is referenced by a package or trip.');
  if (!(await Destination.findByIdAndDelete(req.params.id)))
    throw new HttpError(404, 'Destination not found.');
  res.json({ success: true });
}

export async function updateGallery(req, res) {
  const gallery = req.validated.gallery.map(({ title, caption = '', image = '' }) => ({
    title: title.trim(),
    caption: caption.trim(),
    image,
  }));
  const value = await Destination.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false }, region: /Tamil Nadu|Kerala/i },
    { $set: { gallery, galleryConfigured: true } },
    { returnDocument: 'after', runValidators: true },
  );
  if (!value) throw new HttpError(404, 'Destination not found.');
  res.json(value);
}
