import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cardBelongsToEvent, pickDefaultEvent } from '../src/lib/guests/checkin-rules.ts';

test('a card is accepted only for the event its guest belongs to', () => {
  assert.equal(cardBelongsToEvent('event-a', 'event-a'), true);
  assert.equal(cardBelongsToEvent('event-b', 'event-a'), false);
  assert.equal(cardBelongsToEvent(undefined, 'event-a'), false);
  assert.equal(cardBelongsToEvent('event-a', ''), false);
});

const now = new Date('2027-06-12T10:00:00Z').getTime();
const events = [
  { id: 'old', event_date: '2026-01-10T12:00:00Z', is_published: true },
  { id: 'today', event_date: '2027-06-12T12:00:00Z', is_published: true },
  { id: 'soon-draft', event_date: '2027-06-12T09:00:00Z', is_published: false },
  { id: 'blocked', event_date: '2027-06-12T11:00:00Z', is_published: true, isBlocked: true },
];

test('the chosen event wins when it still exists', () => {
  assert.equal(pickDefaultEvent(events, 'old', now), 'old');
});

test('otherwise the published event closest to today is chosen, ignoring drafts and blocked ones', () => {
  assert.equal(pickDefaultEvent(events, 'missing', now), 'today');
});

test('drafts are used only when nothing is published', () => {
  assert.equal(pickDefaultEvent([{ id: 'draft', event_date: '2027-06-13T00:00:00Z', is_published: false }], '', now), 'draft');
  assert.equal(pickDefaultEvent([], '', now), '');
});
