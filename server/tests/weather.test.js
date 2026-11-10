import test from 'node:test';
import assert from 'node:assert/strict';
import { currentWeather } from '../src/services/weatherService.js';
test('weather uses provider values and translates Tamil without inventing data', async () => {
  const provider = async () => ({
    ok: true,
    json: async () => ({
      current: { temperature_2m: 28, weather_code: 3, time: '2026-11-05T10:00' },
      daily: {
        time: ['2026-11-05'],
        temperature_2m_min: [24],
        temperature_2m_max: [31],
        precipitation_probability_max: [60],
      },
    }),
  });
  const place = { name: 'Test Town', lat: 1.01, lng: 2.02 };
  assert.match(await currentWeather(place, false, provider), /28°C/);
  assert.match(await currentWeather(place, true, provider), /மேகமூட்டம்/);
});
test('unavailable weather fails rather than returning invented values', async () => {
  await assert.rejects(
    () =>
      currentWeather({ name: 'Other', lat: 3.03, lng: 4.04 }, false, async () => ({
        ok: false,
      })),
    /unavailable/,
  );
});
