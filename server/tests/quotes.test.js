import test from 'node:test';
import assert from 'node:assert/strict';
import { quoteHandlers } from '../src/controllers/quoteController.js';

test('quote offers reject past expiry and server generates the quote version', async () => {
  let update;
  const Model = {
    async findOneAndUpdate(filter, body) {
      assert.deepEqual(filter.status.$in, ['pending']);
      update = body;
      return body.$set;
    },
  };
  const handlers = quoteHandlers(Model, { booking: true });
  const req = {
    params: { id: 'request' },
    validated: {
      total: 12500,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      inclusions: 'Hotel',
      exclusions: 'Flights',
      terms: 'Subject to availability',
    },
  };
  await assert.rejects(handlers.offer(req, { json() {} }), /future/);
  req.validated.expiresAt = new Date(Date.now() + 3600000).toISOString();
  await handlers.offer(req, { json() {} });
  assert.equal(update.$set.quote.status, 'offered');
  assert.equal(update.$set.quote.total, 12500);
  assert.equal(update.$set.quote.currency, 'INR');
  assert.match(update.$set.quote.version, /^[a-f0-9-]{36}$/);
});
test('quote acceptance is owner scoped, version checked, and uses stored total', async () => {
  const Model = {
    async findOne(filter) {
      assert.equal(filter.traveler, 'owner');
      assert.equal(filter['quote.version'], 'current-version');
      assert.equal(filter['quote.status'], 'offered');
      assert.ok(filter['quote.expiresAt'].$gt instanceof Date);
      return { quote: { total: 45000 } };
    },
    async findOneAndUpdate(filter, body) {
      assert.equal(body.$set.total, 45000);
      return { total: body.$set.total };
    },
  };
  const handlers = quoteHandlers(Model, { booking: true });
  const req = {
    params: { id: 'request' },
    user: { _id: 'owner', role: 'traveler' },
    validated: { decision: 'accepted', version: 'current-version', total: 1 },
  };
  let result;
  await handlers.respond(req, {
    json(value) {
      result = value;
    },
  });
  assert.equal(result.total, 45000);
  req.user.role = 'admin';
  await assert.rejects(handlers.respond(req, { json() {} }), /Only the traveler/);
});
test('expired or superseded quotes cannot be accepted', async () => {
  const handlers = quoteHandlers({
    async findOne() {
      return null;
    },
  });
  await assert.rejects(
    handlers.respond(
      {
        params: { id: 'request' },
        user: { _id: 'owner' },
        validated: { decision: 'accepted', version: 'old' },
      },
      { json() {} },
    ),
    /expired, changed/,
  );
});
