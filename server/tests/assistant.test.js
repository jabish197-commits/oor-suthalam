import test from 'node:test';
import assert from 'node:assert/strict';
import { assistantService } from '../src/services/assistantService.js';

test('assistant reports missing Gemini setup instead of inventing a response', async (t) => {
  const previous = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  t.after(() => {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  });
  await assert.rejects(
    assistantService.answer([{ role: 'user', text: 'Hello' }]),
    /awaiting its Gemini/,
  );
});
test('assistant keeps API credentials server-side and sends bounded plain-text context', async (t) => {
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'isolated-test-key';
  t.after(() => {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  });
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url.includes('isolated-test-key'), false);
    assert.equal(options.headers['x-goog-api-key'], 'isolated-test-key');
    const body = JSON.parse(options.body);
    assert.equal(body.contents.length, 12);
    assert.match(body.systemInstruction.parts[0].text, /NO live bus/);
    return new Response(
      JSON.stringify({
        candidates: [
          { content: { parts: [{ text: 'Hello, how can I help with your trip?' }] } },
        ],
      }),
      { status: 200 },
    );
  });
  assert.match(
    await assistantService.answer(
      Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 ? 'model' : 'user',
        text: 'Test',
      })),
    ),
    /Hello/,
  );
});

test('provider outages produce a safe actionable error without upstream details', async (t) => {
  const previous = process.env.GEMINI_API_KEY; process.env.GEMINI_API_KEY = 'isolated-test-key';
  t.after(() => { if (previous === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previous; });
  t.mock.method(globalThis, 'fetch', async () => new Response('private upstream text', { status: 503 }));
  await assert.rejects(assistantService.answer([{ role: 'user', text: 'Hi' }]), (error) => error.status === 503 && error.expose === true && /temporarily unavailable/.test(error.message) && !error.message.includes('private'));
});
