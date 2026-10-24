import assert from 'node:assert/strict';
import { test } from 'node:test';
import { coverPhotoOf, coverPositionOf, coverPositionCss } from '../src/lib/invitation/cover.ts';

test('old invitations retain their cover fallbacks', () => {
  assert.equal(coverPhotoOf({ heroImage: '', cover_image: 'legacy.jpg', bestPhotos: ['gallery.jpg'] }), 'legacy.jpg');
  assert.equal(coverPhotoOf({ bestPhotos: ['gallery.jpg'] }), 'gallery.jpg');
  assert.equal(coverPhotoOf({ heroImage: 'chosen.jpg', cover_image: 'legacy.jpg' }), 'chosen.jpg');
});

test('removing the cover does not revive a legacy or gallery image after save', () => {
  const saved = JSON.parse(JSON.stringify({ coverPhotoCleared: true, heroImage: '', cover_image: 'legacy.jpg', bestPhotos: ['gallery.jpg'] }));
  assert.equal(coverPhotoOf(saved), '');
  assert.equal(coverPhotoOf({ ...saved, coverPhotoCleared: false, heroImage: 'new.jpg' }), 'new.jpg');
});

test('cover focal point is bounded and defaults to centre for older data', () => {
  assert.deepEqual(coverPositionOf(), { x: 50, y: 50 });
  assert.deepEqual(coverPositionOf({ x: NaN, y: Infinity }), { x: 50, y: 50 });
  assert.deepEqual(coverPositionOf({ x: -10, y: 140 }), { x: 0, y: 100 });
  assert.equal(coverPositionCss({ x: 25, y: 80 }), '25% 80%');
});
