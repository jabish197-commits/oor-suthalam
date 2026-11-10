import test from 'node:test';
import assert from 'node:assert/strict';
import Inquiry from '../src/models/Inquiry.js';
import InquiryReply from '../src/models/InquiryReply.js';
import { mailService } from '../src/services/mailService.js';
import { reply } from '../src/controllers/inquiryController.js';
import { validateObject, schemas } from '../src/validators/index.js';

test('SMTP reply validation strips recipients and rejects subject header injection', () => {
  const body = { requestId: 'a'.repeat(36), subject: 'Reply', message: 'Hello', to: 'other@example.com' };
  assert.equal(validateObject(schemas.inquiryReply, body).to, undefined);
  assert.throws(() => validateObject(schemas.inquiryReply, { ...body, subject: 'Hi\r\nBcc: another@example.com' }));
});
test('reply uses stored recipient and repeated request identifiers do not send twice', async (t) => {
  const old = Object.fromEntries(['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].map((key) => [key, process.env[key]]));
  Object.assign(process.env, { SMTP_HOST: 'test.invalid', SMTP_USER: 'test@example.com', SMTP_PASS: 'test-only' });
  t.after(() => { for (const [key, value] of Object.entries(old)) if (value === undefined) delete process.env[key]; else process.env[key] = value; });
  const id = 'b'.repeat(24);
  t.mock.method(Inquiry, 'findById', async () => ({ _id: id, email: 'recipient@example.com' }));
  const previous = t.mock.method(InquiryReply, 'findOne', async () => null);
  t.mock.method(InquiryReply, 'create', async () => ({ _id: 'c'.repeat(24) }));
  t.mock.method(InquiryReply, 'updateOne', async () => ({}));
  const send = t.mock.method(mailService, 'sendReply', async (body) => { assert.equal(body.to, 'recipient@example.com'); return { accepted: ['recipient@example.com'] }; });
  const req = { params: { id }, user: { _id: 'd'.repeat(24) }, validated: { requestId: 'a'.repeat(36), subject: 'Reply', message: 'Hello' }, app: { get() { return null; } } };
  let result; const res = { json(value) { result = value; } };
  await reply(req, res); assert.equal(result.status, 'accepted');
  previous.mock.mockImplementation(async () => ({ inquiry: id, status: 'accepted' }));
  await reply(req, res); assert.equal(send.mock.callCount(), 1);
});
