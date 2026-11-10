import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Destination from '../models/Destination.js';
import HttpError from '../utils/HttpError.js';
import { setSession, clearSession } from '../utils/session.js';
const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  savedPlaces: user.savedPlaces,
});
export async function register(req, res) {
  const { name, email, password } = req.validated;
  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
  });
  setSession(res, user);
  res.status(201).json(publicUser(user));
}
export async function login(req, res) {
  const { email, password } = req.validated;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    throw new HttpError(401, 'Email or password is incorrect.');
  setSession(res, user);
  res.json(publicUser(user));
}
export function logout(_req, res) {
  clearSession(res);
  res.json({ success: true });
}
export function me(req, res) {
  // Refresh the expiry when an authenticated user returns to the app.
  setSession(res, req.user);
  res.json(publicUser(req.user));
}
export async function profile(req, res) {
  req.user.name = req.validated.name;
  await req.user.save();
  res.json(publicUser(req.user));
}
export async function saved(req, res) {
  await req.user.populate('savedPlaces');
  res.json(req.user.savedPlaces.filter(Boolean));
}
export async function savePlace(req, res) {
  if (!(await Destination.exists({ _id: req.params.id })))
    throw new HttpError(404, 'Destination not found.');
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { savedPlaces: req.params.id } },
    { new: true },
  );
  res.json(publicUser(user));
}
export async function removePlace(req, res) {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { savedPlaces: req.params.id } },
    { new: true },
  );
  res.json(publicUser(user));
}
export async function users(_req, res) {
  res.json(
    await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(200),
  );
}
