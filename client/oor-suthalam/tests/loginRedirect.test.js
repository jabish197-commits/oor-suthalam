import test from 'node:test';
import assert from 'node:assert/strict';
import { loginRedirect } from '../src/utils/loginRedirect.js';
test('admin sign-in always lands inside the admin workspace', () => {
  for (const path of [
    undefined,
    '/',
    '/traveler',
    '/traveler/plan',
    '/assistant',
    '/packages/example',
  ])
    assert.equal(loginRedirect('admin', path), '/admin');
  assert.equal(loginRedirect('admin', '/admin/bookings'), '/admin/bookings');
});
test('travelers land on the homepage and cannot return to admin pages', () => {
  for (const path of [undefined, '/admin', '/admin/bookings'])
    assert.equal(loginRedirect('traveler', path), '/');
  assert.equal(loginRedirect('traveler', '/traveler/plan'), '/traveler/plan');
});
test('invalid external destinations fall back to the correct role landing page', () => {
  for (const path of ['https://example.com', '//example.com', {}]) {
    assert.equal(loginRedirect('admin', path), '/admin');
    assert.equal(loginRedirect('traveler', path), '/');
  }
});
