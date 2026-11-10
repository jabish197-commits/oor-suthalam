import { originCities } from '../data/tamilNaduCatalog.js';
export const estimateNote =
  'Planning assumptions only, not live prices: shared twin rooms, simple meals, public-transport allowance and a 10% contingency. No vehicle, hotel or activity is reserved. Confirm actual fares and access before travel.';
export function straightLineKm(a, b) {
  const rad = (n) => (n * Math.PI) / 180;
  const x =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
export function estimateTrip(destination, input) {
  const origin = originCities[input.origin];
  if (!origin || !Number.isFinite(destination.lat) || !Number.isFinite(destination.lng))
    return null;
  const km = Math.ceil(straightLineKm(origin, destination) * 1.3);
  // Long-distance one-day trips are not offered. Time includes approximate road travel.
  const travelHours = Math.round((km / 40) * 10) / 10;
  if (travelHours * 2 > input.days * 6) return null;
  const comfort = input.style === 'comfortable';
  const costs = {
    transport: Math.ceil(km * 2 * 2.5 * input.travelers),
    stay:
      Math.max(0, input.days - 1) *
      Math.ceil(input.travelers / 2) *
      (comfort ? 1600 : 1000),
    food: input.days * input.travelers * (comfort ? 600 : 350),
    localTransport: input.days * input.travelers * (comfort ? 350 : 200),
    sightseeing: input.days * input.travelers * 200,
  };
  costs.contingency = Math.ceil(Object.values(costs).reduce((a, b) => a + b, 0) * 0.1);
  const estimatedCost = Object.values(costs).reduce((a, b) => a + b, 0);
  return {
    costs,
    estimatedCost,
    remaining: input.budget - estimatedCost,
    travelHours,
    distanceKm: km,
    estimateNote,
  };
}
export function recommendPlans(destinations, input) {
  const options = destinations
    .filter(
      (d) =>
        /Tamil Nadu|Kerala/i.test(d.region) &&
        (!input.destination || String(d._id) === input.destination) &&
        (input.preference === 'Any' || d.category === input.preference) &&
        (!input.hiddenOnly || d.hiddenGem),
    )
    .flatMap((destination) => {
      const estimate = estimateTrip(destination, input);
      return estimate ? [{ destination, ...estimate }] : [];
    })
    .sort((a, b) => a.travelHours - b.travelHours || a.estimatedCost - b.estimatedCost);
  const affordable = options.filter((p) => p.estimatedCost <= input.budget);
  return {
    plans: affordable.slice(0, 3),
    minimumBudget: options.length
      ? Math.min(...options.map((p) => p.estimatedCost))
      : null,
    estimateNote,
  };
}

export function suggestFromBudget(destinations, choices) {
  const input = {
    origin: 'Chennai',
    travelers: 1,
    preference: 'Any',
    style: 'budget',
    ...choices,
  };
  if (input.days) {
    const result = recommendPlans(destinations, input);
    return {
      ...result,
      plans: result.plans.map((plan) => ({ ...plan, days: input.days })),
      assumptions: {
        origin: input.origin,
        travelers: input.travelers,
        style: input.style,
      },
    };
  }
  const allowed = destinations.filter(
    (d) =>
      /Tamil Nadu|Kerala/i.test(d.region) &&
      (!input.destination || String(d._id) === input.destination) &&
      (input.preference === 'Any' || d.category === input.preference) &&
      (!input.hiddenOnly || d.hiddenGem),
  );
  const candidates = [];
  const minimums = [];
  for (const destination of allowed) {
    let best = null;
    for (let days = 1; days <= 4; days++) {
      const estimate = estimateTrip(destination, { ...input, days });
      if (!estimate) continue;
      minimums.push(estimate.estimatedCost);
      if (estimate.estimatedCost <= input.budget)
        best = { destination, days, ...estimate };
    }
    if (best) candidates.push(best);
  }
  candidates.sort(
    (a, b) => a.travelHours - b.travelHours || a.estimatedCost - b.estimatedCost,
  );
  // Offer an actual getaway before an in-town plan, unless that is all the budget permits.
  const away = candidates.filter((p) => p.destination.name !== input.origin);
  const pool = away.length ? away : candidates;
  const selected = [];
  const categories = new Set();
  for (const plan of pool) {
    if (!categories.has(plan.destination.category)) {
      selected.push(plan);
      categories.add(plan.destination.category);
    }
    if (selected.length === 3) break;
  }
  for (const plan of pool) {
    if (selected.length === 3) break;
    if (!selected.includes(plan)) selected.push(plan);
  }
  return {
    plans: selected,
    minimumBudget: minimums.length ? Math.min(...minimums) : null,
    estimateNote,
    assumptions: { origin: input.origin, travelers: input.travelers, style: input.style },
  };
}
