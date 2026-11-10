import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import Destination from '../src/models/Destination.js';
import Package from '../src/models/Package.js';
import Trip from '../src/models/Trip.js';
import Booking from '../src/models/Booking.js';
import Inquiry from '../src/models/Inquiry.js';
import SiteSettings from '../src/models/SiteSettings.js';
import TravelPartner from '../src/models/TravelPartner.js';
import sharp from 'sharp';
import { unlink, readFile } from 'node:fs/promises';
import { uploadDirectory } from '../src/controllers/imageController.js';

// Real HTTP, validation, password hashing and JWTs; database calls are test doubles.
// These tests never read .env, connect to Atlas, or mutate real records.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'isolated-test-secret-not-used-by-the-application-12345';
process.env.CLIENT_URL = 'http://localhost:5173';
const { default: app } = await import('../src/app.js');
const { setSession } = await import('../src/utils/session.js');

const userId = 'a'.repeat(24);
const resourceId = 'b'.repeat(24);
const traveler = {
  _id: userId,
  name: 'Test Traveler',
  email: 'test@example.com',
  role: 'traveler',
  savedPlaces: [],
};
const admin = { ...traveler, role: 'admin' };
let server;
let base;

before(async () => {
  await new Promise((resolve, reject) => {
    server = app.listen(0, '127.0.0.1', resolve);
    server.once('error', reject);
  });
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  if (server)
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections();
    });
});

function query(value) {
  return {
    select() {
      return this;
    },
    populate() {
      return this;
    },
    sort() {
      return this;
    },
    limit() {
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(value).then(resolve, reject);
    },
  };
}
function cookie(user = traveler) {
  let token;
  setSession(
    {
      cookie(_name, value) {
        token = value;
      },
    },
    user,
  );
  return `session=${token}`;
}
async function request(path, { method = 'GET', body, session, origin } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(session ? { Cookie: session } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { response, data: await response.json() };
}

test('health endpoint and unknown routes return predictable JSON', async () => {
  const health = await request('/health');
  assert.equal(health.response.status, 200);
  assert.equal(health.data.success, true);
  assert.equal((await request('/does-not-exist')).response.status, 404);
});

test('malformed IDs fail before a database lookup', async () => {
  assert.equal((await request('/destinations/not-an-id')).response.status, 400);
  assert.equal((await request('/packages/not-an-id')).response.status, 400);
});

test('session endpoints reject missing or forged cookies', async () => {
  assert.equal((await request('/auth/me')).response.status, 401);
  assert.equal(
    (await request('/auth/me', { session: 'session=forged' })).response.status,
    401,
  );
});

test('registration hashes the password and cannot self-assign admin', async (t) => {
  let stored;
  t.mock.method(User, 'create', async (body) => {
    stored = new User(body);
    return stored;
  });
  const result = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Test',
      email: 'test@example.com',
      password: 'test-password-123',
      role: 'admin',
    },
  });
  assert.equal(result.response.status, 201);
  assert.equal(result.data.role, 'traveler');
  assert.equal(result.data.passwordHash, undefined);
  assert.equal(result.data.password, undefined);
  assert.ok(await bcrypt.compare('test-password-123', stored.passwordHash));
  const setCookie = result.response.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);
});

test('duplicate registration returns conflict without driver details', async (t) => {
  t.mock.method(User, 'create', async () => {
    throw Object.assign(new Error('internal details'), { code: 11000 });
  });
  const result = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Test', email: 'test@example.com', password: 'test-password-123' },
  });
  assert.equal(result.response.status, 409);
  assert.ok(!JSON.stringify(result.data).includes('internal details'));
});

test('login creates a usable session and rejects a wrong password', async (t) => {
  const passwordHash = await bcrypt.hash('correct-password', 4);
  t.mock.method(User, 'findOne', () => query({ ...traveler, passwordHash }));
  t.mock.method(User, 'findById', async () => traveler);
  const login = await request('/auth/login', {
    method: 'POST',
    body: { email: traveler.email, password: 'correct-password' },
  });
  assert.equal(login.response.status, 200);
  const session = login.response.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('/auth/me', { session })).data._id, userId);
  const bad = await request('/auth/login', {
    method: 'POST',
    body: { email: traveler.email, password: 'wrong-password' },
  });
  assert.equal(bad.response.status, 401);
});

test('logout clears the cookie', async () => {
  const result = await request('/auth/logout', { method: 'POST' });
  assert.equal(result.response.status, 200);
  assert.match(result.response.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/i);
});

test('mutations from an unapproved origin are blocked', async () => {
  const result = await request('/auth/logout', {
    method: 'POST',
    origin: 'https://unapproved.example',
  });
  assert.equal(result.response.status, 403);
});

test('traveler cannot manage the catalog or list other users', async (t) => {
  t.mock.method(User, 'findById', async () => traveler);
  const session = cookie();
  assert.equal(
    (await request('/destinations', { method: 'POST', body: {}, session })).response
      .status,
    403,
  );
  assert.equal(
    (await request('/packages', { method: 'POST', body: {}, session })).response.status,
    403,
  );
  assert.equal((await request('/auth/users', { session })).response.status, 403);
});

test('admin creates a destination through validated catalog routes', async (t) => {
  t.mock.method(User, 'findById', async () => admin);
  let stored;
  t.mock.method(Destination, 'create', async (body) => {
    stored = body;
    return { _id: resourceId, ...body };
  });
  const result = await request('/destinations', {
    method: 'POST',
    session: cookie(admin),
    body: {
      name: 'Test Hills',
      region: 'Test district, Tamil Nadu',
      category: 'Nature',
      description: 'An example destination for testing.',
      dailyBudget: 1200,
      hiddenAdminField: true,
    },
  });
  assert.equal(result.response.status, 201);
  assert.equal(stored.hiddenAdminField, undefined);
});

test('search treats regex punctuation as literal text', async (t) => {
  let filter;
  t.mock.method(Destination, 'find', (body) => {
    filter = body;
    return query([]);
  });
  const result = await request('/destinations?q=.*');
  assert.equal(result.response.status, 200);
  assert.equal(filter.$or[0].name.test('unrelated name'), false);
  assert.equal(filter.$or[0].name.test('literal .* name'), true);
});

test('booking totals come from package prices, never from the browser', async (t) => {
  t.mock.method(User, 'findById', async () => traveler);
  t.mock.method(Package, 'findOne', async () => ({ _id: resourceId, price: 1500 }));
  let stored;
  t.mock.method(Booking, 'create', async (body) => {
    stored = body;
    return { _id: resourceId, status: 'pending', ...body };
  });
  const result = await request('/bookings', {
    method: 'POST',
    session: cookie(),
    body: {
      package: resourceId,
      startDate: '2099-12-01',
      travelers: 2,
      total: 1,
      status: 'confirmed',
    },
  });
  assert.equal(result.response.status, 201);
  assert.equal(stored.total, 3000);
  assert.equal(stored.traveler, userId);
  assert.equal(result.data.status, 'pending');
});

test('traveler cannot confirm a booking and cancellation is scoped to its owner', async (t) => {
  t.mock.method(User, 'findById', async () => traveler);
  let filter;
  t.mock.method(Booking, 'findOneAndUpdate', async (body) => {
    filter = body;
    return null;
  });
  const confirm = await request(`/bookings/${resourceId}/status`, {
    method: 'PATCH',
    session: cookie(),
    body: { status: 'confirmed' },
  });
  assert.equal(confirm.response.status, 403);
  const cancel = await request(`/bookings/${resourceId}/status`, {
    method: 'PATCH',
    session: cookie(),
    body: { status: 'cancelled' },
  });
  assert.equal(cancel.response.status, 409);
  assert.equal(filter.traveler, userId);
  assert.deepEqual(filter.status, { $ne: 'cancelled' });
});

test('admin can confirm a pending booking', async (t) => {
  t.mock.method(User, 'findById', async () => admin);
  t.mock.method(Booking, 'findOneAndUpdate', async (_filter, update) => ({
    _id: resourceId,
    ...update,
  }));
  const result = await request(`/bookings/${resourceId}/status`, {
    method: 'PATCH',
    session: cookie(admin),
    body: { status: 'confirmed' },
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.status, 'confirmed');
});

test('trip creation uses the signed-in owner and generates all itinerary days', async (t) => {
  t.mock.method(User, 'findById', async () => traveler);
  t.mock.method(Destination, 'findById', async () => ({
    _id: resourceId,
    region: 'Chennai, Tamil Nadu',
    lat: 13.08,
    lng: 80.27,
    dailyBudget: 1000,
    activities: ['Walk', 'Market'],
    indoorActivities: ['Gallery'],
  }));
  t.mock.method(Trip, 'create', async (body) => ({ _id: resourceId, ...body }));
  const result = await request('/trips', {
    method: 'POST',
    session: cookie(),
    body: {
      origin: 'Chennai',
      style: 'budget',
      title: 'Test trip',
      destination: resourceId,
      startDate: '2099-12-01',
      days: 3,
      travelers: 2,
      budget: 8000,
      traveler: 'c'.repeat(24),
    },
  });
  assert.equal(result.response.status, 201);
  assert.equal(result.data.traveler, userId);
  assert.equal(result.data.estimatedCost, 7150);
  assert.equal(result.data.costs.stay, 2000);
  assert.equal(result.data.itinerary.length, 3);
});

test('trip creation rejects plans over budget before writing a record', async (t) => {
  t.mock.method(User, 'findById', async () => traveler);
  t.mock.method(Destination, 'findById', async () => ({
    _id: resourceId,
    region: 'Chennai, Tamil Nadu',
    lat: 13.08,
    lng: 80.27,
    activities: ['Museum'],
  }));
  let writes = 0;
  t.mock.method(Trip, 'create', async () => {
    writes++;
  });
  const result = await request('/trips', {
    method: 'POST',
    session: cookie(),
    body: {
      title: 'Budget check',
      destination: resourceId,
      startDate: '2099-12-01',
      origin: 'Chennai',
      style: 'budget',
      days: 2,
      travelers: 2,
      budget: 100,
    },
  });
  assert.equal(result.response.status, 400);
  assert.match(result.data.message, /exceeds your budget/);
  assert.equal(writes, 0);
});
test('budget recommendations require authentication and return only affordable plans', async (t) => {
  const body = {
    origin: 'Chennai',
    style: 'budget',
    days: 2,
    travelers: 2,
    budget: 10000,
    preference: 'Any',
  };
  assert.equal(
    (await request('/trips/recommendations', { method: 'POST', body })).response.status,
    401,
  );
  t.mock.method(User, 'findById', async () => traveler);
  t.mock.method(Destination, 'find', async () => [
    {
      _id: resourceId,
      region: 'Chennai, Tamil Nadu',
      category: 'City',
      lat: 13.08,
      lng: 80.27,
    },
  ]);
  const result = await request('/trips/recommendations', {
    method: 'POST',
    session: cookie(),
    body,
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.plans.length, 1);
  assert.ok(result.data.plans[0].estimatedCost <= body.budget);
});

test('reading a trip always applies the signed-in owner filter', async (t) => {
  t.mock.method(User, 'findById', async () => traveler);
  let filter;
  t.mock.method(Trip, 'findOne', (body) => {
    filter = body;
    return query(null);
  });
  const result = await request(`/trips/${resourceId}`, { session: cookie() });
  assert.equal(result.response.status, 404);
  assert.equal(filter.traveler, userId);
});

test('saved places use addToSet to prevent duplicates', async (t) => {
  t.mock.method(User, 'findById', async () => traveler);
  t.mock.method(Destination, 'exists', async () => ({ _id: resourceId }));
  let update;
  t.mock.method(User, 'findByIdAndUpdate', async (_id, body) => {
    update = body;
    return { ...traveler, savedPlaces: [resourceId] };
  });
  const result = await request(`/auth/saved/${resourceId}`, {
    method: 'PUT',
    session: cookie(),
  });
  assert.equal(result.response.status, 200);
  assert.deepEqual(update, { $addToSet: { savedPlaces: resourceId } });
});

test('public inquiry creates only the validated message fields', async (t) => {
  let stored;
  t.mock.method(Inquiry, 'create', async (body) => {
    stored = body;
  });
  const result = await request('/inquiries', {
    method: 'POST',
    body: {
      name: 'Test',
      email: 'test@example.com',
      message: 'A useful test inquiry.',
      internalNotes: 'not allowed',
    },
  });
  assert.equal(result.response.status, 201);
  assert.equal(stored.internalNotes, undefined);
});

test('unexpected database failures never expose connection details', async (t) => {
  t.mock.method(Destination, 'find', () => {
    throw new Error('mongodb://private-connection-details');
  });
  const result = await request('/destinations');
  assert.equal(result.response.status, 500);
  assert.ok(!JSON.stringify(result.data).includes('private-connection-details'));
});

test('admin overview requires a real administrator session', async (t) => {
  assert.equal((await request('/admin/overview')).response.status, 401);
  t.mock.method(User, 'findById', async () => traveler);
  assert.equal(
    (await request('/admin/overview', { session: cookie() })).response.status,
    403,
  );
});

test('admin overview returns full database counts and actual booking state totals', async (t) => {
  t.mock.method(User, 'findById', async () => admin);
  t.mock.method(User, 'countDocuments', async () => 25);
  t.mock.method(Destination, 'countDocuments', async () => 220);
  t.mock.method(Package, 'countDocuments', async () => 12);
  t.mock.method(Inquiry, 'countDocuments', async () => 7);
  t.mock.method(Booking, 'aggregate', async () => [
    { _id: 'pending', count: 3, value: 15000 },
    { _id: 'confirmed', count: 2, value: 10000 },
    { _id: 'cancelled', count: 1, value: 5000 },
  ]);
  t.mock.method(Booking, 'find', () => query([]));
  t.mock.method(Inquiry, 'find', () => query([]));
  const result = await request('/admin/overview', { session: cookie(admin) });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.stats.destinations, 220);
  assert.equal(result.data.stats.totalBookings, 6);
  assert.equal(result.data.stats.pendingBookings, 3);
  assert.equal(result.data.stats.confirmedValue, 10000);
  assert.ok(!Number.isNaN(Date.parse(result.data.updatedAt)));
});

test('admin can create a package for an existing destination', async (t) => {
  t.mock.method(User, 'findById', async () => admin);
  t.mock.method(Destination, 'exists', async () => ({ _id: resourceId }));
  let stored;
  t.mock.method(Package, 'create', async (body) => {
    stored = body;
    return { _id: resourceId, ...body };
  });
  const result = await request('/packages', {
    method: 'POST',
    session: cookie(admin),
    body: {
      title: 'Test getaway',
      description: 'A sample package for route testing.',
      destination: resourceId,
      days: 3,
      price: 6000,
      inclusions: ['Accommodation'],
    },
  });
  assert.equal(result.response.status, 201);
  assert.equal(stored.destination, resourceId);
  assert.equal(stored.price, 6000);
});

test('packages cannot be created without a real destination', async (t) => {
  t.mock.method(User, 'findById', async () => admin);
  t.mock.method(Destination, 'exists', async () => null);
  const result = await request('/packages', {
    method: 'POST',
    session: cookie(admin),
    body: {
      title: 'Test getaway',
      description: 'A sample package for route testing.',
      destination: resourceId,
      days: 3,
      price: 6000,
    },
  });
  assert.equal(result.response.status, 400);
});

test('photo uploads require admin access and reject invalid or oversized images', async (t) => {
  const send = (body, session) =>
    fetch(base + '/destinations/image', {
      method: 'POST',
      headers: { 'Content-Type': 'image/png', ...(session ? { Cookie: session } : {}) },
      body,
    });
  assert.equal((await send(Buffer.from('invalid'))).status, 401);
  t.mock.method(User, 'findById', async () => traveler);
  assert.equal((await send(Buffer.from('invalid'), cookie())).status, 403);
  User.findById.mock.restore();
  t.mock.method(User, 'findById', async () => admin);
  assert.equal((await send(Buffer.from('invalid'), cookie(admin))).status, 400);
  assert.equal(
    (await send(Buffer.alloc(5 * 1024 * 1024 + 1), cookie(admin))).status,
    413,
  );
});

test('uploaded photos are re-encoded and served with an upload URL', async (t) => {
  t.mock.method(User, 'findById', async () => admin);
  const png = await sharp({
    create: { width: 8, height: 8, channels: 3, background: '#ccaa44' },
  })
    .png()
    .toBuffer();
  const response = await fetch(base + '/destinations/image', {
    method: 'POST',
    headers: { 'Content-Type': 'image/png', Cookie: cookie(admin) },
    body: png,
  });
  assert.equal(response.status, 201);
  const { image } = await response.json();
  assert.match(image, /^\/api\/uploads\/[a-f0-9-]{36}\.webp$/);
  t.after(() => unlink(`${uploadDirectory}/${image.split('/').at(-1)}`));
  const stored = await fetch(base.replace(/\/api$/, '') + image);
  assert.equal(stored.status, 200);
  assert.equal(stored.headers.get('content-type'), 'image/webp');
  assert.equal(
    (await sharp(Buffer.from(await stored.arrayBuffer())).metadata()).format,
    'webp',
  );
});

const futureFlightDate = '2099-05-20';
test('retired flight endpoints are not available', async () => {
  assert.equal((await request('/flights')).response.status, 404);
  assert.equal(
    (await request('/flights', { method: 'POST', session: cookie(), body: {} })).response
      .status,
    404,
  );
});

test('package change proposals preserve the original booking and restrict ownership', async (t) => {
  t.mock.method(User, 'findById', async () => traveler);
  t.mock.method(Package, 'findOne', async () => ({ _id: resourceId, price: 8000 }));
  let filter, update;
  t.mock.method(Booking, 'findOneAndUpdate', async (f, u) => {
    filter = f;
    update = u;
    return { _id: resourceId };
  });
  const result = await request(`/bookings/${resourceId}/change`, {
    method: 'POST',
    session: cookie(),
    body: {
      package: resourceId,
      startDate: futureFlightDate,
      travelers: 3,
      total: 1,
      status: 'confirmed',
    },
  });
  assert.equal(result.response.status, 200);
  assert.equal(filter.traveler, userId);
  assert.equal(filter['changeRequest.status'].$ne, 'pending');
  assert.equal(update.$set.changeRequest.status, 'pending');
  assert.equal(update.$set.package, undefined);
  assert.equal(update.$set.total, undefined);
  assert.equal(
    (
      await request(`/bookings/${resourceId}/change`, {
        method: 'PATCH',
        session: cookie(),
        body: { decision: 'approved' },
      })
    ).response.status,
    403,
  );
});

test('admin approval recalculates package change cost and clears previous partner assignment', async (t) => {
  t.mock.method(User, 'findById', async () => admin);
  t.mock.method(Booking, 'findOne', async () => ({
    _id: resourceId,
    changeRequest: {
      package: resourceId,
      startDate: new Date(futureFlightDate),
      travelers: 3,
    },
  }));
  t.mock.method(Package, 'findOne', async () => ({
    _id: resourceId,
    price: 6000,
    priceMode: 'fixed',
  }));
  let update;
  t.mock.method(Booking, 'findOneAndUpdate', async (_f, u) => {
    update = u;
    return { _id: resourceId };
  });
  assert.equal(
    (
      await request(`/bookings/${resourceId}/change`, {
        method: 'PATCH',
        session: cookie(admin),
        body: { decision: 'approved' },
      })
    ).response.status,
    200,
  );
  assert.equal(update.$set.total, 18000);
  assert.equal(update.$set.status, 'pending');
  assert.equal(update.$set.partner, null);
});

test('partnership application cannot self-approve and partner assignments are scoped', async (t) => {
  t.mock.method(User, 'findById', async () => traveler);
  t.mock.method(TravelPartner, 'exists', async () => false);
  let stored;
  t.mock.method(TravelPartner, 'create', async (body) => {
    stored = body;
    return body;
  });
  assert.equal(
    (
      await request('/partners/apply', {
        method: 'POST',
        session: cookie(),
        body: {
          company: 'Test Travels',
          phone: '+91 9000000000',
          regions: 'Tamil Nadu',
          description: 'Local itinerary and transport planning.',
          status: 'approved',
          owner: resourceId,
        },
      })
    ).response.status,
    201,
  );
  assert.equal(stored.owner, userId);
  assert.equal(stored.status, undefined);
  assert.equal((await request('/partners', { session: cookie() })).response.status, 403);
  t.mock.method(TravelPartner, 'findOne', async () => null);
  assert.equal(
    (await request('/partners/assignments', { session: cookie() })).response.status,
    403,
  );
  TravelPartner.findOne.mock.restore();
  t.mock.method(TravelPartner, 'findOne', async () => ({ _id: resourceId }));
  let filter;
  t.mock.method(Booking, 'find', (value) => {
    filter = value;
    return query([]);
  });
  assert.equal(
    (await request('/partners/assignments', { session: cookie() })).response.status,
    200,
  );
  assert.equal(filter.partner, resourceId);
  assert.equal(filter.status.$ne, 'cancelled');
});

test('returning users receive a renewed persistent session cookie', async (t) => {
  t.mock.method(User, 'findById', async () => traveler);
  const result = await request('/auth/me', { session: cookie() });
  assert.equal(result.response.status, 200);
  assert.match(result.response.headers.get('set-cookie'), /Max-Age=2592000/i);
});

test('partners can respond only to their own assigned requests', async (t) => {
  t.mock.method(User, 'findById', async () => traveler);
  t.mock.method(TravelPartner, 'findOne', async () => ({ _id: resourceId }));
  let filter, update;
  t.mock.method(Booking, 'findOneAndUpdate', async (f, u) => {
    filter = f;
    update = u;
    return { _id: resourceId };
  });
  const result = await request(`/partners/assignments/${resourceId}/response`, {
    method: 'PATCH',
    session: cookie(),
    body: { status: 'accepted' },
  });
  assert.equal(result.response.status, 200);
  assert.equal(filter.partner, resourceId);
  assert.equal(filter.partnerStatus, 'assigned');
  assert.equal(filter['changeRequest.status'].$ne, 'pending');
  assert.equal(update.partnerStatus, 'accepted');
});

test('budget-only suggestions choose an affordable duration without requiring a form of preferences', async (t) => {
  t.mock.method(User, 'findById', async () => traveler);
  t.mock.method(Destination, 'find', async () => [
    {
      _id: resourceId,
      name: 'Mamallapuram',
      region: 'Chengalpattu, Tamil Nadu',
      category: 'Heritage',
      lat: 12.62,
      lng: 80.19,
      activities: ['Temple', 'Beach'],
    },
  ]);
  const result = await request('/trips/recommendations', {
    method: 'POST',
    session: cookie(),
    body: { budget: 5000 },
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.assumptions.origin, 'Chennai');
  assert.equal(result.data.assumptions.travelers, 1);
  assert.ok(result.data.plans.length);
  assert.ok(
    result.data.plans.every((p) => p.estimatedCost <= 5000 && p.days >= 1 && p.days <= 4),
  );
});
test('destination galleries are admin-only and save only validated photo fields', async (t) => {
  const body = {
    gallery: [
      {
        title: 'Marina promenade',
        caption: 'Public seafront walk',
        image: '',
        untrusted: 'ignored',
      },
    ],
  };
  assert.equal(
    (await request('/destinations/' + resourceId + '/gallery', { method: 'PUT', body }))
      .response.status,
    401,
  );
  t.mock.method(User, 'findById', async () => traveler);
  assert.equal(
    (
      await request('/destinations/' + resourceId + '/gallery', {
        method: 'PUT',
        session: cookie(),
        body,
      })
    ).response.status,
    403,
  );
  User.findById.mock.restore();
  t.mock.method(User, 'findById', async () => admin);
  let update;
  t.mock.method(Destination, 'findOneAndUpdate', async (_f, u) => {
    update = u;
    return { _id: resourceId, ...u.$set };
  });
  const result = await request('/destinations/' + resourceId + '/gallery', {
    method: 'PUT',
    session: cookie(admin),
    body,
  });
  assert.equal(result.response.status, 200);
  assert.equal(update.$set.galleryConfigured, true);
  assert.equal(update.$set.gallery[0].untrusted, undefined);
  assert.equal(
    (
      await request('/destinations/' + resourceId + '/gallery', {
        method: 'PUT',
        session: cookie(admin),
        body: { gallery: [{ title: 'Place', caption: 3, image: '' }] },
      })
    ).response.status,
    400,
  );
});
test('homepage video upload is admin-only, stored locally and returned as public settings', async (t) => {
  assert.equal(
    (await request('/site-settings/video', { method: 'POST', body: {} })).response.status,
    401,
  );
  t.mock.method(User, 'findById', async () => traveler);
  assert.equal(
    (
      await request('/site-settings', {
        method: 'PUT',
        session: cookie(),
        body: { heroVideo: '' },
      })
    ).response.status,
    403,
  );
  User.findById.mock.restore();
  t.mock.method(User, 'findById', async () => admin);
  const buffer = await readFile(
    new URL('../../client/oor-suthalam/public/videos/sunny-coast.mp4', import.meta.url),
  );
  const uploaded = await fetch(base + '/site-settings/video', {
    method: 'POST',
    headers: { Cookie: cookie(admin), 'Content-Type': 'video/mp4' },
    body: buffer,
  });
  assert.equal(uploaded.status, 201);
  const { video } = await uploaded.json();
  assert.match(video, /^\/api\/uploads\/[a-f0-9-]{36}\.mp4$/);
  t.after(() => unlink(uploadDirectory + '/' + video.split('/').at(-1)));
  let stored;
  t.mock.method(SiteSettings, 'findOneAndUpdate', async (_f, u) => {
    stored = u.$set;
    return stored;
  });
  t.mock.method(SiteSettings, 'findOne', async () => stored);
  const saved = await request('/site-settings', {
    method: 'PUT',
    session: cookie(admin),
    body: { heroVideo: video, heroPoster: '', key: 'injected' },
  });
  assert.equal(saved.response.status, 200);
  assert.equal(stored.key, undefined);
  const result = await request('/site-settings');
  assert.equal(result.data.heroVideo, video);
  assert.deepEqual(Object.keys(result.data).sort(), ['heroPoster', 'heroVideo']);
  assert.equal(
    (
      await request('/site-settings', {
        method: 'PUT',
        session: cookie(admin),
        body: { heroVideo: 'https://untrusted.example/video.mp4' },
      })
    ).response.status,
    400,
  );
});
test('admin assistant reads current pending bookings without exposing emails or mutating data', async (t) => {
  assert.equal(
    (
      await request('/admin/assistant', {
        method: 'POST',
        body: { message: 'Pending bookings' },
      })
    ).response.status,
    401,
  );
  t.mock.method(User, 'findById', async () => traveler);
  assert.equal(
    (
      await request('/admin/assistant', {
        method: 'POST',
        session: cookie(),
        body: { message: 'Pending bookings' },
      })
    ).response.status,
    403,
  );
  User.findById.mock.restore();
  t.mock.method(User, 'findById', async () => admin);
  t.mock.method(Booking, 'aggregate', async () => [{ _id: 'pending', count: 2 }]);
  t.mock.method(Destination, 'countDocuments', async () => 26);
  t.mock.method(Package, 'countDocuments', async () => 26);
  let filter;
  t.mock.method(Booking, 'find', (f) => {
    filter = f;
    return query([
      {
        traveler: { name: 'Test Traveler', email: 'private@example.com' },
        package: { title: 'Tamil Nadu trip', destination: { name: 'Chennai' } },
        status: 'pending',
        travelers: 1,
        startDate: '2099-01-01',
      },
    ]);
  });
  const result = await request('/admin/assistant', {
    method: 'POST',
    session: cookie(admin),
    body: { message: 'Show pending bookings', replyLanguage: 'ta-IN' },
  });
  assert.equal(result.response.status, 200);
  assert.equal(filter.status, 'pending');
  assert.equal(result.data.stats.pending, 2);
  assert.equal(result.data.bookings[0].traveler, 'Test Traveler');
  assert.equal(JSON.stringify(result.data).includes('private@example.com'), false);
  assert.match(result.data.text, /[\u0B80-\u0BFF]/);
});

test('message read state persists and is admin-only', async (t) => {
  t.mock.method(User, 'findById', () => query(traveler));
  assert.equal(
    (
      await request('/inquiries/' + resourceId + '/read', {
        method: 'PATCH',
        session: cookie(),
      })
    ).response.status,
    403,
  );
  t.mock.method(User, 'findById', () => query(admin));
  t.mock.method(Inquiry, 'findByIdAndUpdate', async (id, update) => {
    assert.equal(id, resourceId);
    assert.ok(update.$set.readAt instanceof Date);
    return { _id: id, readAt: update.$set.readAt };
  });
  const result = await request('/inquiries/' + resourceId + '/read', {
    method: 'PATCH',
    session: cookie(admin),
  });
  assert.equal(result.response.status, 200);
  assert.ok(result.data.readAt);
});
