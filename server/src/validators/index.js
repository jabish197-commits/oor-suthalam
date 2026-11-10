import { originCities } from '../data/tamilNaduCatalog.js';
import HttpError from '../utils/HttpError.js';
export const text =
  (min = 1, max = 5000) =>
  (value) =>
    typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
export const email = (value) =>
  text(3, 254)(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const id = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
export const number =
  (min, max, integer = false) =>
  (value) =>
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max &&
    (!integer || Number.isInteger(value));
export const futureDate = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value &&
  value >= new Date().toISOString().slice(0, 10);
const list = (value) =>
  Array.isArray(value) && value.length <= 50 && value.every(text(1, 300));
const image = (value) =>
  value === '' ||
  (text(1, 2000)(value) &&
    (/^https:\/\//.test(value) || /^\/api\/uploads\/[a-f0-9-]{36}\.webp$/.test(value)));
// bcrypt accepts at most 72 bytes, which is different from 72 Unicode characters.
const password = (min) => (value) =>
  text(min, 72)(value) && Buffer.byteLength(value, 'utf8') <= 72;
export const schemas = {
  register: { name: text(2, 100), email, password: password(10) },
  login: { email, password: password(1) },
  profile: { name: text(2, 100) },
  destinationGallery: {
    gallery: (value) =>
      Array.isArray(value) &&
      value.length <= 20 &&
      value.every(
        (item) =>
          item &&
          typeof item === 'object' &&
          text(2, 120)(item.title) &&
          (item.caption === undefined || text(0, 500)(item.caption)) &&
          (item.image === '' ||
            (typeof item.image === 'string' &&
              (/^\/api\/uploads\/[a-f0-9-]{36}\.webp$/.test(item.image) ||
                /^\/images\/(?:destinations\/[a-z-]+|chettinad)\/(?:attraction-\d+|extra-\d+)\.webp$/.test(
                  item.image,
                )))),
      ),
  },
  destination: {
    name: text(2, 100),
    region: (v) => text(2, 100)(v) && /Tamil Nadu|Kerala/i.test(v),
    'lat?': number(8, 14),
    'lng?': number(76, 81),
    'hiddenGem?': (v) => typeof v === 'boolean',
    'accessNote?': text(0, 1000),
    category: (v) => ['Nature', 'Heritage', 'Coast', 'City'].includes(v),
    description: text(10),
    dailyBudget: number(0, 1000000),
    'image?': image,
    'activities?': list,
    'indoorActivities?': list,
  },
  package: {
    title: text(2, 150),
    description: text(10),
    destination: id,
    days: number(1, 30, true),
    price: number(0, 10000000),
    'priceMode?': (v) => ['fixed', 'quote'].includes(v),
    'travelType?': (v) => v === 'land',
    'inclusions?': list,
    'active?': (v) => typeof v === 'boolean',
  },
  autoBudgetSearch: {
    budget: number(1, 100000000),
    'origin?': (v) => Object.hasOwn(originCities, v),
    'travelers?': number(1, 20, true),
    'days?': number(1, 4, true),
    'preference?': (v) => ['Any', 'Nature', 'Heritage', 'Coast', 'City'].includes(v),
    'style?': (v) => ['budget', 'comfortable'].includes(v),
    'hiddenOnly?': (v) => typeof v === 'boolean',
    'destination?': id,
  },
  budgetSearch: {
    'destination?': id,
    origin: (v) => Object.hasOwn(originCities, v),
    days: number(1, 4, true),
    travelers: number(1, 20, true),
    budget: number(1, 100000000),
    preference: (v) => ['Any', 'Nature', 'Heritage', 'Coast', 'City'].includes(v),
    style: (v) => ['budget', 'comfortable'].includes(v),
    'hiddenOnly?': (v) => typeof v === 'boolean',
  },
  trip: {
    'origin?': (v) => Object.hasOwn(originCities, v),
    'style?': (v) => ['budget', 'comfortable'].includes(v),
    title: text(2, 100),
    destination: id,
    startDate: futureDate,
    days: number(1, 30, true),
    travelers: number(1, 20, true),
    budget: number(0, 100000000),
  },
  booking: { package: id, startDate: futureDate, travelers: number(1, 20, true) },
  bookingChange: { package: id, startDate: futureDate, travelers: number(1, 20, true) },
  changeDecision: { decision: (v) => ['approved', 'rejected'].includes(v) },
  partner: {
    company: text(2, 150),
    phone: (v) => typeof v === 'string' && /^[+\d\s()-]{7,30}$/.test(v),
    regions: text(2, 500),
    description: text(10, 2000),
  },
  partnerDecision: { status: (v) => ['approved', 'rejected'].includes(v) },
  assignment: { partner: id },
  partnerResponse: { status: (v) => ['accepted', 'declined'].includes(v) },
  flight: {
    origin: text(2, 100),
    destination: text(2, 100),
    departureDate: futureDate,
    'returnDate?': futureDate,
    travelers: number(1, 9, true),
    cabin: (v) => ['Economy', 'Premium economy', 'Business'].includes(v),
    'notes?': text(0, 1000),
  },
  flightStatus: { status: (v) => ['reviewed', 'cancelled'].includes(v) },
  quoteOffer: {
    total: number(1, 10000000),
    inclusions: text(1, 3000),
    exclusions: text(1, 3000),
    terms: text(1, 3000),
    expiresAt: (value) =>
      typeof value === 'string' &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value) > new Date(),
  },
  quoteResponse: {
    version: (value) => typeof value === 'string' && /^[a-f0-9-]{36}$/i.test(value),
    decision: (value) => ['accepted', 'declined'].includes(value),
  },
  inquiryReply: {
    requestId: (value) => typeof value === 'string' && /^[a-f0-9-]{36}$/i.test(value),
    subject: (value) => text(1, 150)(value) && !/[\r\n]/.test(value),
    message: text(1, 5000),
  },
  inquiry: { name: text(2, 100), email, message: text(10, 3000) },
  status: { status: (v) => ['confirmed', 'cancelled'].includes(v) },
};
export function validateObject(schema, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new HttpError(400, 'A JSON object is required.');
  const result = {};
  for (const [field, check] of Object.entries(schema)) {
    const optional = field.endsWith('?');
    const key = field.replace(/\?$/, '');
    if (optional && body[key] === undefined) continue;
    if (!check(body[key])) throw new HttpError(400, `Invalid ${key}.`);
    result[key] =
      typeof body[key] === 'string' && key !== 'password' ? body[key].trim() : body[key];
  }
  return result;
}
