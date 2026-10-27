import assert from 'node:assert/strict';
import { test } from 'node:test';
import { invitationPhotoOutputSize } from '../src/lib/invitation/pdf-image-optimization.ts';

test('share PDFs downsample photos to the display size plus a small sharpness margin', () => {
  assert.deepEqual(
    invitationPhotoOutputSize(675, 900, [{ width: 120, height: 160, fit: 'cover' }]),
    { width: 150, height: 200 },
  );
});

test('cover photos retain enough pixels for the visible crop', () => {
  assert.deepEqual(
    invitationPhotoOutputSize(4000, 6000, [{ width: 448, height: 500, fit: 'cover' }]),
    { width: 560, height: 840 },
  );
});

test('smaller photos are never enlarged for PDF output', () => {
  assert.deepEqual(
    invitationPhotoOutputSize(120, 160, [{ width: 200, height: 200, fit: 'contain' }]),
    { width: 120, height: 160 },
  );
});
