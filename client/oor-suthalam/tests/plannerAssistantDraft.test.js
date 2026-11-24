import test from 'node:test';
import assert from 'node:assert/strict';
import { plannerAssistantDraft } from '../src/utils/plannerAssistantDraft.js';
import { money } from '../src/utils/format.js';

test('assistant draft retains group budget, duration and travel preferences', () => {
  const draft = plannerAssistantDraft(
    {
      origin: 'Chennai',
      budget: '10000',
      travelers: '2',
      days: '3',
      preference: 'Nature',
      style: 'comfortable',
      hiddenOnly: 'true',
      destination: 'internal-destination-id',
    },
    'Ooty',
  );
  assert.ok(draft.includes('from Chennai'));
  assert.ok(draft.includes('2 travelers'));
  assert.ok(draft.includes(`${money(10000)} for everyone and all days combined`));
  assert.ok(draft.includes('3 days'));
  assert.ok(draft.includes('Ooty'));
  assert.ok(draft.includes('nature destinations'));
  assert.ok(draft.includes('comfortable trip'));
  assert.ok(draft.includes('quieter places'));
  assert.ok(!draft.includes('internal-destination-id'));
});

test('unfinished planner choices become questions rather than invalid numbers', () => {
  const draft = plannerAssistantDraft({
    origin: 'Madurai',
    budget: '',
    travelers: '',
    days: '',
  });
  assert.ok(draft.includes('choose a total group budget'));
  assert.ok(draft.includes('choose the group size'));
  assert.ok(draft.includes('Suggest a trip of 1–4 days'));
  assert.ok(!draft.includes('NaN'));
  assert.ok(!draft.includes('undefined'));
});

test('one traveler and one day use singular wording', () => {
  const draft = plannerAssistantDraft({
    origin: 'Chennai',
    budget: 5000,
    travelers: 1,
    days: 1,
  });
  assert.ok(draft.includes('1 traveler.'));
  assert.ok(draft.includes('1 day.'));
});
