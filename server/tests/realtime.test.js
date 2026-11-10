import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import express from 'express';
import { io as client } from '../../client/oor-suthalam/node_modules/socket.io-client/build/esm-debug/index.js';
import { attachRealtime } from '../src/services/realtime.js';
import { setSession } from '../src/utils/session.js';
import User from '../src/models/User.js';
import Inquiry from '../src/models/Inquiry.js';
import { create } from '../src/controllers/inquiryController.js';

function session() {
  let token;
  setSession(
    {
      cookie(_name, value) {
        token = value;
      },
    },
    { _id: 'a'.repeat(24) },
  );
  return `session=${token}`;
}
function wait(socket, event) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for ${event}`)),
      4000,
    );
    socket.once(event, (value) => {
      clearTimeout(timer);
      resolve(value);
    });
  });
}
test('message sockets enforce admin sessions and notify only after saving', async (t) => {
  const app = express();
  app.set('allowedOrigins', new Set(['http://localhost:5173']));
  const http = createServer(app);
  const realtime = attachRealtime(http, app);
  await new Promise((resolve) => http.listen(0, '127.0.0.1', resolve));
  const clients = [];
  t.after(async () => {
    clients.forEach((socket) => socket.disconnect());
    await new Promise((resolve) => realtime.close(resolve));
  });
  function connect(cookie) {
    const socket = client(`http://127.0.0.1:${http.address().port}`, {
      path: '/api/socket.io',
      transports: ['websocket'],
      autoConnect: false,
      reconnection: false,
      extraHeaders: {
        Origin: 'http://localhost:5173',
        ...(cookie ? { Cookie: cookie } : {}),
      },
    });
    clients.push(socket);
    return socket;
  }
  const guest = connect();
  const denied = wait(guest, 'connect_error');
  guest.connect();
  assert.match((await denied).message, /Administrator/);
  const userMock = t.mock.method(User, 'findById', async () => ({ role: 'traveler' }));
  const traveler = connect(session());
  const forbidden = wait(traveler, 'connect_error');
  traveler.connect();
  assert.match((await forbidden).message, /Administrator/);
  userMock.mock.mockImplementation(async () => ({ role: 'admin' }));
  const admin = connect(session());
  const connected = wait(admin, 'connect');
  admin.connect();
  await connected;
  let saved = false;
  t.mock.method(Inquiry, 'create', async () => {
    saved = true;
  });
  const notified = wait(admin, 'inquiries:updated');
  await create(
    {
      validated: {
        name: 'Test',
        email: 'test@example.com',
        message: 'Test message only',
      },
      app,
    },
    {
      status() {
        return this;
      },
      json() {},
    },
  );
  await notified;
  assert.equal(saved, true);
});
