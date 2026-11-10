import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateTrip, recommendPlans } from '../src/services/budgetPlannerService.js';
import { validateObject, schemas } from '../src/validators/index.js';
const near = {
  _id: 'a'.repeat(24),
  name: 'Chennai',
  region: 'Chennai, Tamil Nadu',
  category: 'City',
  lat: 13.08,
  lng: 80.27,
};
const far = { ...near, _id: 'b'.repeat(24), name: 'Kanyakumari', lat: 8.09, lng: 77.54 };
const input = {
  origin: 'Chennai',
  days: 2,
  travelers: 2,
  budget: 10000,
  style: 'budget',
  preference: 'Any',
};
test('group estimate includes shared rooms, all travelers and contingency', () => {
  const plan = estimateTrip(near, input);
  assert.equal(plan.costs.stay, 1000);
  assert.equal(plan.costs.food, 1400);
  assert.equal(
    plan.estimatedCost,
    Object.values(plan.costs).reduce((a, b) => a + b, 0),
  );
  assert.equal(plan.remaining, input.budget - plan.estimatedCost);
});
test('recommendations never exceed budget or include international destinations', () => {
  const output = recommendPlans([near, { ...near, region: 'Singapore' }], {
    ...input,
    budget: 100,
  });
  assert.deepEqual(output.plans, []);
  assert.ok(output.minimumBudget > 100);
  const fit = recommendPlans([near, far], input);
  assert.ok(fit.plans.every((p) => p.estimatedCost <= input.budget));
});
test('one-day long-distance trips and unknown coordinates are not proposed', () => {
  assert.equal(estimateTrip(far, { ...input, days: 1 }), null);
  assert.equal(estimateTrip({ ...near, lat: undefined }, input), null);
});
test('preference, selected destination and quieter-discovery filters are respected', () => {
  assert.equal(recommendPlans([near], { ...input, hiddenOnly: true }).plans.length, 0);
  assert.equal(recommendPlans([near], { ...input, preference: 'Coast' }).plans.length, 0);
  assert.equal(
    recommendPlans([near], { ...input, destination: far._id }).plans.length,
    0,
  );
});
test('planner rejects unsupported origins and invalid group or budget values', () => {
  assert.throws(() =>
    validateObject(schemas.budgetSearch, { ...input, origin: 'Dubai' }),
  );
  assert.throws(() => validateObject(schemas.budgetSearch, { ...input, travelers: 1.5 }));
  assert.throws(() => validateObject(schemas.budgetSearch, { ...input, budget: 0 }));
});
