import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractBudget,
  travelKnowledgeService,
} from '../src/services/travelKnowledgeService.js';
import Destination from '../src/models/Destination.js';
import Package from '../src/models/Package.js';
const place = {
  _id: 'a'.repeat(24),
  name: 'Mamallapuram',
  region: 'Chengalpattu, Tamil Nadu',
  category: 'Heritage',
  lat: 12.62,
  lng: 80.19,
  activities: ['Shore Temple', 'Five Rathas'],
};
const query = (value) => ({
  sort() {
    return this;
  },
  select() {
    return this;
  },
  limit: async () => value,
});
test('budget extraction recognises amounts in Tamil and English without inventing one', () => {
  for (const [text, value] of [
    ['My budget is ₹5,000', 5000],
    ['budget 10k', 10000],
    ['என் பட்ஜெட் ௫௦௦௦', 5000],
    ['என் பட்ஜெட் ஐந்தாயிரம்', 5000],
    ['my budget is five thousand', 5000],
  ])
    assert.equal(extractBudget(text), value);
  assert.equal(extractBudget('show my trips'), null);
});
test('catalog and budget answers use public database records and honest estimates', async (t) => {
  t.mock.method(Destination, 'find', (filter) => {
    assert.equal(filter.active.$ne, false);
    return query([place]);
  });
  t.mock.method(Package, 'find', () => query([]));
  const answer = await travelKnowledgeService.reply(
    [{ role: 'user', text: 'My budget is 5000' }],
    'en-IN',
  );
  assert.match(answer.text, /one traveler starting from Chennai/);
  assert.ok(answer.cards.length);
  assert.ok(answer.cards.every((c) => c.estimatedCost <= 5000));
  assert.match(answer.text, /planning estimates/);
});
test('location distance is computed locally and explicitly distinguished from road distance', async (t) => {
  t.mock.method(Destination, 'find', () => query([place]));
  const answer = await travelKnowledgeService.reply(
    [{ role: 'user', text: 'How far is Mamallapuram?' }],
    'en-IN',
    { lat: 13.08, lng: 80.27 },
  );
  assert.match(answer.text, /Straight-line/);
  assert.match(answer.text, /Road distances/);
  assert.ok(answer.text.includes('\n'));
  assert.equal(answer.cards.length, 1);
  const noLocation = await travelKnowledgeService.reply(
    [{ role: 'user', text: 'nearest places' }],
    'en-IN',
  );
  assert.match(noLocation.text, /Use my location/);
});

test('a named trip gets an outline and the budget follow-up retains its destination', async (t) => {
  const target = {
    ...place,
    _id: 'c'.repeat(24),
    name: 'Alappuzha',
    region: 'Kerala',
    lat: 9.5,
    lng: 76.34,
    activities: ['Alappuzha Beach', 'Backwater boat enquiry'],
  };
  t.mock.method(Destination, 'find', () => query([place, target]));
  t.mock.method(Package, 'find', () => query([]));
  const first = { role: 'user', text: 'can you help to plan the trip for Alappuzha' };
  const reply = await travelKnowledgeService.reply([first], 'en-IN');
  assert.match(reply.text, /Alappuzha Beach/);
  assert.match(reply.text, /keep Alappuzha selected/);
  const next = await travelKnowledgeService.reply(
    [first, { role: 'model', text: reply.text }, { role: 'user', text: '5000' }],
    'en-IN',
  );
  assert.ok(next.cards.every((c) => String(c.destinationId) === target._id));
  assert.match(next.text, /Alappuzha/);
});

test('spoken Tamil budgets and room allowances are distinguished', () => {
  assert.equal(extractBudget('சென்னை போக மூவாயிரரூபா plan'), 3000);
  assert.equal(extractBudget('budget three thousand'), 3000);
  assert.equal(extractBudget('room 1000 rupees'), null);
  assert.equal(extractBudget('room 1000 rupees, total budget 3000'), 3000);
});

test('chat plans calculate specified group, duration and room allowance', async (t) => {
  t.mock.method(Destination, 'find', () => query([place]));
  t.mock.method(Package, 'find', () => query([]));
  const result = await travelKnowledgeService.reply(
    [
      {
        role: 'user',
        text: 'From Chennai to Mamallapuram, budget 10000, 2 people, 2 days, room 1200 rupees',
      },
    ],
    'en-IN',
  );
  assert.match(result.text, /2 traveler/);
  assert.match(result.text, /stay ₹1,200/);
  assert.match(result.text, /Day 1:/);
  assert.match(result.text, /Day 2:/);
  assert.match(result.text, /remaining/);
  assert.ok(result.cards.every((card) => card.estimatedCost <= 10000));
});

test('impossible chat budgets do not invent affordable plans', async (t) => {
  t.mock.method(Destination, 'find', () => query([place]));
  t.mock.method(Package, 'find', () => query([]));
  const result = await travelKnowledgeService.reply(
    [{ role: 'user', text: 'Mamallapuram budget 10' }],
    'en-IN',
  );
  assert.equal(result.cards.length, 0);
  assert.match(result.text, /lowest planning estimate/);
});

test('Tamil budget before label is not confused with following traveler count', () => {
  assert.equal(extractBudget('சென்னை செல்ல மூவாயிரரூபா பட்ஜெட், 1 பேர், 2 நாட்கள், room 1000 rupees'), 3000);
});
