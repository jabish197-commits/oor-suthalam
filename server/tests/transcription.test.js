import test from 'node:test';
import assert from 'node:assert/strict';
import { transcribeAudio } from '../src/services/transcriptionService.js';

test('voice transcription sends audio to Gemini and returns only transcript text', async (t) => {
  const before = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key-only';
  t.after(() => {
    if (before === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = before;
  });
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.contents[0].parts[1].inlineData.mimeType, 'audio/webm');
    assert.equal(
      body.contents[0].parts[1].inlineData.data,
      Buffer.from('sample-audio').toString('base64'),
    );
    assert.match(body.contents[0].parts[0].text, /ONLY the transcript/);
    return new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'Plan my Jaipur trip' }] } }],
      }),
      { status: 200 },
    );
  });
  assert.equal(
    await transcribeAudio(Buffer.from('sample-audio'), 'audio/webm'),
    'Plan my Jaipur trip',
  );
});
test('empty voice response is an explicit error rather than an invented message', async (t) => {
  const before = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key-only';
  t.after(() => {
    if (before === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = before;
  });
  t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 200 }));
  await assert.rejects(
    transcribeAudio(Buffer.from('sample-audio'), 'audio/webm'),
    /No clear speech/,
  );
});

test('temporary transcription overload tries the fallback model', async (t) => {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY = 'test-key-only';
  process.env.GEMINI_MODEL = 'test-fallback';
  t.after(() => {
    if (key === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = key;
    if (model === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = model;
  });
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls++;
    if (calls === 1) return new Response('{}', { status: 503 });
    assert.match(url, /test-fallback/);
    return new Response(
      JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Hello' }] } }] }),
    );
  });
  assert.equal(await transcribeAudio(Buffer.from('sample'), 'audio/webm'), 'Hello');
  assert.equal(calls, 2);
});
