import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../src/services/api.js';

test('API accepts a valid null response for an absent partner application', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('null', { status: 200 }));
  assert.equal(await api('/partners/me'), null);
});

test('API rejects a successful response that is not JSON', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('<html>Not API data</html>', { status: 200 }),
  );
  await assert.rejects(api('/partners/me'), /unexpected response/);
});

test('API preserves server errors', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(JSON.stringify({ message: 'Sign in required.' }), { status: 401 }),
  );
  await assert.rejects(
    api('/partners/me'),
    (error) => error.status === 401 && error.message === 'Sign in required.',
  );
});
