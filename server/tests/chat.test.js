import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Chat from '../src/models/ChatConversation.js';
import { setSession } from '../src/utils/session.js';

test('chat history and deletion require authentication and are scoped to the owner', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  const base = `http://127.0.0.1:${server.address().port}/api/chats`;
  assert.equal(
    (
      await fetch(`${base}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'audio/webm' },
        body: Buffer.from('audio'),
      })
    ).status,
    401,
  );
  const id = 'b'.repeat(24);
  const owner = 'a'.repeat(24);
  assert.equal((await fetch(`${base}/${id}`)).status, 401);
  t.mock.method(User, 'findById', async () => ({ _id: owner, role: 'traveler' }));
  let token;
  setSession(
    {
      cookie(_key, value) {
        token = value;
      },
    },
    { _id: owner },
  );
  const headers = { Cookie: `session=${token}` };
  assert.equal(
    (
      await fetch(`${base}/transcribe`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: '{}',
      })
    ).status,
    400,
  );
  t.mock.method(Chat, 'findOne', async (filter) => {
    assert.equal(filter.owner, owner);
    assert.equal(filter._id, id);
    return null;
  });
  assert.equal((await fetch(`${base}/${id}`, { headers })).status, 404);
  t.mock.method(Chat, 'deleteOne', async (filter) => {
    assert.equal(filter.owner, owner);
    return { deletedCount: 0 };
  });
  assert.equal((await fetch(`${base}/${id}`, { method: 'DELETE', headers })).status, 404);
  assert.equal(
    (
      await fetch(`${base}/${id}/messages`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'x'.repeat(2001) }),
      })
    ).status,
    400,
  );
});
