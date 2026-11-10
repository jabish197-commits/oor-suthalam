import Booking from '../models/Booking.js';
import Package from '../models/Package.js';
import HttpError from '../utils/HttpError.js';
export async function list(req, res) {
  res.json(
    await Booking.find(req.user.role === 'admin' ? {} : { traveler: req.user._id })
      .populate({ path: 'package', populate: { path: 'destination' } })
      .populate('traveler', 'name email')
      .populate('changeRequest.package', 'title price priceMode')
      .sort({ createdAt: -1 })
      .limit(200),
  );
}
export async function create(req, res) {
  const pkg = await Package.findOne({ _id: req.validated.package, active: true });
  if (!pkg) throw new HttpError(404, 'Package not found.');
  res.status(201).json(
    await Booking.create({
      ...req.validated,
      traveler: req.user._id,
      total: pkg.price * req.validated.travelers,
      priceMode: pkg.priceMode || 'fixed',
    }),
  );
}
export async function update(req, res) {
  const filter = { _id: req.params.id };
  if (req.user.role !== 'admin') {
    if (req.validated.status !== 'cancelled')
      throw new HttpError(403, 'Only an admin can confirm bookings.');
    filter.traveler = req.user._id;
  }
  filter.status = { $ne: 'cancelled' };
  if (req.validated.status === 'confirmed') {
    filter['changeRequest.status'] = { $ne: 'pending' };
    filter.$or = [
      { 'quote.status': 'accepted' },
      { quote: null, priceMode: { $ne: 'quote' } },
    ];
  }
  const value = await Booking.findOneAndUpdate(
    filter,
    { status: req.validated.status },
    { new: true, runValidators: true },
  );
  if (!value) throw new HttpError(409, 'Booking unavailable or already cancelled.');
  res.json(value);
}

export async function requestChange(req, res) {
  const pkg = await Package.findOne({ _id: req.validated.package, active: true });
  if (!pkg) throw new HttpError(404, 'Choose an available package.');
  const result = await Booking.findOneAndUpdate(
    {
      _id: req.params.id,
      traveler: req.user._id,
      status: { $ne: 'cancelled' },
      'changeRequest.status': { $ne: 'pending' },
    },
    { $set: { changeRequest: { ...req.validated, status: 'pending' } } },
    { returnDocument: 'after', runValidators: true },
  );
  if (!result)
    throw new HttpError(
      409,
      'Booking unavailable or a change is already awaiting review.',
    );
  res.json(result);
}

export async function reviewChange(req, res) {
  const booking = await Booking.findOne({
    _id: req.params.id,
    status: { $ne: 'cancelled' },
    'changeRequest.status': 'pending',
  });
  if (!booking) throw new HttpError(409, 'No pending change request is available.');
  const update = { 'changeRequest.status': req.validated.decision };
  if (req.validated.decision === 'approved') {
    const pkg = await Package.findOne({
      _id: booking.changeRequest.package,
      active: true,
    });
    if (!pkg) throw new HttpError(409, 'Requested package is no longer available.');
    if (
      new Date(booking.changeRequest.startDate).toISOString().slice(0, 10) <
      new Date().toISOString().slice(0, 10)
    )
      throw new HttpError(400, 'Requested departure date has passed.');
    Object.assign(update, {
      package: pkg._id,
      startDate: booking.changeRequest.startDate,
      travelers: booking.changeRequest.travelers,
      total: pkg.price * booking.changeRequest.travelers,
      priceMode: pkg.priceMode || 'fixed',
      status: 'pending',
      partner: null,
      quote: null,
    });
  }
  const result = await Booking.findOneAndUpdate(
    {
      _id: booking._id,
      status: { $ne: 'cancelled' },
      'changeRequest.status': 'pending',
      'changeRequest.package': booking.changeRequest.package,
      'changeRequest.startDate': booking.changeRequest.startDate,
      'changeRequest.travelers': booking.changeRequest.travelers,
    },
    { $set: update },
    { returnDocument: 'after', runValidators: true },
  );
  if (!result)
    throw new HttpError(409, 'Booking changed during review. Refresh and try again.');
  res.json(result);
}
