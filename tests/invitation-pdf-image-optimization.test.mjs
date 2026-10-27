import assert from 'node:assert/strict';
import { test } from 'node:test';
import { invitationPhotoOutputSize } from '../src/lib/invitation/pdf-image-optimization.ts';

test('share PDFs downsample photos to twice their displayed size', () => {
  assert.deepEqual(
    invitationPhotoOutputSize(675, 900, [{ width: 120, height: 160, fit: 'cover' }]),
    { width: 240, height: 320 },
  );
});

test('cover photos retain enough pixels for the visible crop', () => {
  assert.deepEqual(
    invitationPhotoOutputSize(4000, 6000, [{ width: 448, height: 500, fit: 'cover' }]),
    { width: 896, height: 1344 },
  );
});

test('smaller photos are never enlarged for PDF output', () => {
  assert.deepEqual(
    invitationPhotoOutputSize(120, 160, [{ width: 200, height: 200, fit: 'contain' }]),
    { width: 120, height: 160 },
  );
});
