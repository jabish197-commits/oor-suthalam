import Package from '../models/Package.js';
import Destination from '../models/Destination.js';
import HttpError from '../utils/HttpError.js';
export async function list(_req, res) {
  const destinations = await Destination.find({
    active: { $ne: false },
    region: /Tamil Nadu|Kerala/i,
  }).select('_id');
  res.json(
    await Package.find({
      active: true,
      travelType: { $ne: 'flight' },
      destination: { $in: destinations.map((d) => d._id) },
    })
      .populate('destination')
      .sort({ createdAt: -1 })
      .limit(200),
  );
}
export async function detail(req, res) {
  const value = await Package.findOne({ _id: req.params.id, active: true }).populate(
    'destination',
  );
  if (
    !value ||
    value.travelType === 'flight' ||
    !value.destination ||
    value.destination.active === false ||
    !/Tamil Nadu|Kerala/i.test(value.destination.region)
  )
    throw new HttpError(404, 'Package not found.');
  res.json(value);
}
async function checkDestination(value) {
  if (
    !(await Destination.exists({
      _id: value.destination,
      active: { $ne: false },
      region: /Tamil Nadu|Kerala/i,
    }))
  )
    throw new HttpError(400, 'Choose an existing destination.');
}
export async function create(req, res) {
  await checkDestination(req.validated);
  res.status(201).json(await Package.create(req.validated));
}
export async function update(req, res) {
  await checkDestination(req.validated);
  const value = await Package.findByIdAndUpdate(req.params.id, req.validated, {
    new: true,
    runValidators: true,
  });
  if (!value) throw new HttpError(404, 'Package not found.');
  res.json(value);
}
export async function remove(req, res) {
  if (!(await Package.findByIdAndUpdate(req.params.id, { active: false })))
    throw new HttpError(404, 'Package not found.');
  res.json({ success: true });
}
