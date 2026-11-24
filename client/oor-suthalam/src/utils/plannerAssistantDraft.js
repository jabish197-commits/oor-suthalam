import { money } from './format.js';

export function plannerAssistantDraft(input, destinationName) {
  const travelers = Number(input.travelers);
  const budget = Number(input.budget);
  const days = Number(input.days);
  const parts = [
    `Help me plan a trip from ${input.origin || 'a starting town I will choose'}.`,
    Number.isInteger(travelers) && travelers > 0
      ? `There ${travelers === 1 ? 'is 1 traveler' : `are ${travelers} travelers`}.`
      : 'Please help me choose the group size.',
    Number.isFinite(budget) && budget > 0
      ? `My total group budget is ${money(budget)} for everyone and all days combined.`
      : 'Please help me choose a total group budget.',
    Number.isInteger(days) && days > 0
      ? `I would like ${days} ${days === 1 ? 'day' : 'days'}.`
      : 'Suggest a trip of 1–4 days that fits my budget.',
  ];
  if (destinationName) parts.push(`I am interested in ${destinationName}.`);
  if (input.preference && input.preference !== 'Any') {
    parts.push(`I prefer ${input.preference.toLowerCase()} destinations.`);
  }
  parts.push(
    input.style === 'comfortable'
      ? 'I prefer a comfortable trip.'
      : 'Keep the trip economical.',
  );
  if (input.hiddenOnly === 'true') parts.push('Focus on quieter places.');
  parts.push('Please suggest an itinerary with estimated group costs.');
  return parts.join(' ');
}
