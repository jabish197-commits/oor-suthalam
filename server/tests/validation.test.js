import test from 'node:test';
import assert from 'node:assert/strict';
import { validateObject, schemas, futureDate } from '../src/validators/index.js';
import { buildItinerary } from '../src/services/itineraryService.js';
import User from '../src/models/User.js';
import Booking from '../src/models/Booking.js';
import rateLimit from '../src/middleware/rateLimit.js';

test('registration strips privilege and database operator fields', () => {
  const data = validateObject(schemas.register, {
    name: '  Test Traveler  ',
    email: 'traveler@example.com',
    password: 'valid-password-123',
    role: 'admin',
    savedPlaces: ['injected'],
    $set: { role: 'admin' },
  });
  assert.deepEqual(Object.keys(data), ['name', 'email', 'password']);
  assert.equal(data.name, 'Test Traveler');
});

test('rejects non-string credentials and bcrypt byte-limit collisions', () => {
  assert.throws(
    () => validateObject(schemas.login, { email: { $ne: null }, password: 'password' }),
    /Invalid email/,
  );
  assert.throws(
    () =>
      validateObject(schemas.register, {
        name: 'Test',
        email: 'a@example.com',
        password: '😀'.repeat(20),
      }),
    /Invalid password/,
  );
});

test('rejects invalid calendar dates, past dates, and fractional traveler counts', () => {
  assert.equal(futureDate('2099-02-30'), false);
  assert.equal(futureDate('2000-01-01'), false);
  assert.equal(futureDate('2099-12-01'), true);
  assert.throws(
    () =>
      validateObject(schemas.booking, {
        package: 'a'.repeat(24),
        startDate: '2099-12-01',
        travelers: 1.5,
      }),
    /Invalid travelers/,
  );
});

test('booking bodies cannot supply price or confirmation status', () => {
  const body = validateObject(schemas.booking, {
    package: 'a'.repeat(24),
    startDate: '2099-12-01',
    travelers: 2,
    total: 1,
    status: 'confirmed',
  });
  assert.equal(body.total, undefined);
  assert.equal(body.status, undefined);
});

test('itineraries calculate group costs and include an alternative for every day', () => {
  const result = buildItinerary(
    {
      dailyBudget: 1200,
      activities: ['Walk', 'Market', 'Gallery'],
      indoorActivities: ['Museum'],
    },
    3,
    2,
  );
  assert.equal(result.estimatedCost, 7200);
  assert.equal(result.itinerary.length, 3);
  assert.deepEqual(
    result.itinerary.map((day) => day.day),
    [1, 2, 3],
  );
  assert.equal(new Set(result.itinerary.flatMap((day) => day.activities)).size, 3);
  assert.ok(
    result.itinerary.every(
      (day) => day.activities.length > 0 && day.planB[0] === 'Museum',
    ),
  );
});

test('planner supplies useful defaults for an empty activity catalog', () => {
  const result = buildItinerary({ dailyBudget: 500 }, 1, 1);
  assert.ok(result.itinerary[0].activities.every(Boolean));
  assert.ok(result.itinerary[0].planB.every(Boolean));
});

test('user schema defaults to traveler and JSON never includes passwordHash', () => {
  const user = new User({
    name: 'Test',
    email: 'TEST@EXAMPLE.COM',
    passwordHash: 'private-hash',
  });
  assert.equal(user.role, 'traveler');
  assert.equal(user.email, 'test@example.com');
  assert.equal(user.toJSON().passwordHash, undefined);
});

test('booking schema rejects unsupported status and negative totals', () => {
  const booking = new Booking({
    traveler: 'a'.repeat(24),
    package: 'b'.repeat(24),
    startDate: new Date(),
    travelers: 1,
    total: -1,
    status: 'paid',
  });
  const error = booking.validateSync();
  assert.ok(error.errors.total);
  assert.ok(error.errors.status);
});

test('rate limiter blocks excess requests without calling the next handler', () => {
  const limiter = rateLimit('unit-test', 2);
  let nextCalls = 0;
  let status;
  const res = {
    status(value) {
      status = value;
      return this;
    },
    json() {},
  };
  for (let index = 0; index < 3; index++)
    limiter({ ip: 'test-client' }, res, () => nextCalls++);
  assert.equal(nextCalls, 2);
  assert.equal(status, 429);
});
