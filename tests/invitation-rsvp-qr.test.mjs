import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shouldShowCheckinQr } from '../src/lib/invitation/rsvp-qr.ts';

test('immediate QR mode displays a pass before an RSVP response', () => {
  assert.equal(shouldShowCheckinQr('immediate', undefined), true);
  assert.equal(shouldShowCheckinQr('immediate', 'pending'), true);
});

test('confirmation-only QR mode waits for a confirmed response', () => {
  assert.equal(shouldShowCheckinQr('after-confirmation', undefined), false);
  assert.equal(shouldShowCheckinQr('after-confirmation', 'pending'), false);
  assert.equal(shouldShowCheckinQr('after-confirmation', 'confirmed', true), true);
});

test('a declined RSVP never displays the check-in QR', () => {
  assert.equal(shouldShowCheckinQr('immediate', 'declined'), false);
  assert.equal(shouldShowCheckinQr('after-confirmation', 'declined', true), false);
});
