import TravelPartner from '../models/TravelPartner.js';
import Booking from '../models/Booking.js';
import HttpError from '../utils/HttpError.js';
export async function directory(_req, res) {
  res.json(
    await TravelPartner.find({ status: 'approved' })
      .select('company regions description')
      .sort({ company: 1 })
      .limit(200),
  );
}

export async function apply(req, res) {
  if (await TravelPartner.exists({ owner: req.user._id }))
    throw new HttpError(409, 'You already have a partnership application.');
  res
    .status(201)
    .json(await TravelPartner.create({ ...req.validated, owner: req.user._id }));
}
export async function mine(req, res) {
  res.json(await TravelPartner.findOne({ owner: req.user._id }));
}
export async function list(_req, res) {
  res.json(
    await TravelPartner.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .limit(200),
  );
}
export async function review(req, res) {
  const partner = await TravelPartner.findByIdAndUpdate(
    req.params.id,
    { status: req.validated.status },
    { returnDocument: 'after', runValidators: true },
  );
  if (!partner) throw new HttpError(404, 'Application not found.');
  res.json(partner);
}
export async function assignments(req, res) {
  const partner = await TravelPartner.findOne({
    owner: req.user._id,
    status: 'approved',
  });
  if (!partner) throw new HttpError(403, 'Approved travel partners only.');
  // No traveler email, phone or profile is exposed to a partner.
  res.json(
    await Booking.find({ partner: partner._id, status: { $ne: 'cancelled' } })
      .select('package startDate travelers status changeRequest.status partnerStatus')
      .populate({
        path: 'package',
        select: 'title days destination',
        populate: { path: 'destination', select: 'name region' },
      })
      .sort({ createdAt: -1 })
      .limit(200),
  );
}
export async function assign(req, res) {
  const partner = await TravelPartner.findOne({
    _id: req.validated.partner,
    status: 'approved',
  });
  if (!partner) throw new HttpError(400, 'Choose an approved travel partner.');
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.id, status: { $ne: 'cancelled' } },
    { partner: partner._id, partnerStatus: 'assigned' },
    { returnDocument: 'after', runValidators: true },
  );
  if (!booking) throw new HttpError(409, 'Booking unavailable or cancelled.');
  res.json({ success: true });
}

export async function respond(req, res) {
  const partner = await TravelPartner.findOne({
    owner: req.user._id,
    status: 'approved',
  });
  if (!partner) throw new HttpError(403, 'Approved travel partners only.');
  const result = await Booking.findOneAndUpdate(
    {
      _id: req.params.id,
      partner: partner._id,
      partnerStatus: 'assigned',
      status: { $ne: 'cancelled' },
      'changeRequest.status': { $ne: 'pending' },
    },
    { partnerStatus: req.validated.status },
    { returnDocument: 'after', runValidators: true },
  );
  if (!result)
    throw new HttpError(
      409,
      'Request unavailable, already answered, or awaiting a package change.',
    );
  res.json({ success: true });
}
