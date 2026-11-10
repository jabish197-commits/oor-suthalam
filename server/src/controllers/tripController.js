import { estimateTrip, suggestFromBudget } from '../services/budgetPlannerService.js';
import Trip from '../models/Trip.js';
import Destination from '../models/Destination.js';
import { buildItinerary } from '../services/itineraryService.js';
import HttpError from '../utils/HttpError.js';
export async function list(req, res) {
  res.json(
    await Trip.find({ traveler: req.user._id })
      .populate('destination')
      .sort({ createdAt: -1 })
      .limit(200),
  );
}
export async function detail(req, res) {
  const value = await Trip.findOne({
    _id: req.params.id,
    traveler: req.user._id,
  }).populate('destination');
  if (!value) throw new HttpError(404, 'Trip not found.');
  res.json(value);
}
export async function recommendations(req, res) {
  const places = await Destination.find({
    active: { $ne: false },
    region: /Tamil Nadu|Kerala/i,
  });
  res.json(suggestFromBudget(places, req.validated));
}
export async function create(req, res) {
  const destination = await Destination.findById(req.validated.destination);
  if (
    !destination ||
    destination.active === false ||
    !/Tamil Nadu|Kerala/i.test(destination.region)
  )
    throw new HttpError(404, 'Choose an active Tamil Nadu or Kerala destination.');
  if (!req.validated.origin || !req.validated.style)
    throw new HttpError(
      400,
      'Choose your departure town and travel style in the budget planner.',
    );
  if (req.validated.days > 4)
    throw new HttpError(400, 'This planner supports short trips up to 4 days.');
  const estimate = estimateTrip(destination, req.validated);
  if (!estimate)
    throw new HttpError(
      400,
      'This destination is too far for the selected duration, or needs cost information.',
    );
  if (estimate.estimatedCost > req.validated.budget)
    throw new HttpError(
      400,
      'This plan exceeds your budget. Choose a nearer destination or adjust your dates.',
    );
  const plan = buildItinerary(destination, req.validated.days, req.validated.travelers);
  res.status(201).json(
    await Trip.create({
      ...req.validated,
      ...plan,
      ...estimate,
      traveler: req.user._id,
    }),
  );
}
export async function remove(req, res) {
  if (!(await Trip.findOneAndDelete({ _id: req.params.id, traveler: req.user._id })))
    throw new HttpError(404, 'Trip not found.');
  res.json({ success: true });
}
