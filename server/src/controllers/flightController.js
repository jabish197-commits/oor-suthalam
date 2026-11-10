import FlightRequest from '../models/FlightRequest.js';
import HttpError from '../utils/HttpError.js';

export async function list(req, res) {
  const filter = req.user.role === 'admin' ? {} : { traveler: req.user._id };
  res.json(
    await FlightRequest.find(filter)
      .populate('traveler', 'name email')
      .sort({ createdAt: -1 })
      .limit(200),
  );
}
export async function create(req, res) {
  const data = req.validated;
  if (data.origin.toLowerCase() === data.destination.toLowerCase())
    throw new HttpError(400, 'Departure and arrival must be different.');
  if (data.returnDate && data.returnDate < data.departureDate)
    throw new HttpError(400, 'Return date must be on or after departure.');
  res.status(201).json(await FlightRequest.create({ ...data, traveler: req.user._id }));
}
export async function update(req, res) {
  const filter = { _id: req.params.id, status: { $ne: 'cancelled' } };
  if (req.user.role !== 'admin') {
    if (req.validated.status !== 'cancelled')
      throw new HttpError(403, 'Only an admin can review flight enquiries.');
    filter.traveler = req.user._id;
  }
  const result = await FlightRequest.findOneAndUpdate(
    filter,
    { status: req.validated.status },
    { returnDocument: 'after', runValidators: true },
  );
  if (!result)
    throw new HttpError(409, 'Flight enquiry unavailable or already cancelled.');
  res.json(result);
}
