import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  groupDrinksByCategory,
  groupDrinksIntoRows,
  normalizeDrinkCategory,
  partitionDrinksForMenu,
} from '../src/lib/invitation/drinks.ts';

test('drink categories group options in a predictable order and keep their original order', () => {
  const groups = groupDrinksByCategory([
    { id: 'tea', name: 'Thé', desc: '', emoji: '', category: 'hot' },
    { id: 'water', name: 'Eau', desc: '', emoji: '', category: 'water' },
    { id: 'juice', name: 'Jus', desc: '', emoji: '', category: 'juice-soda' },
    { id: 'coffee', name: 'Café', desc: '', emoji: '', category: 'hot' },
  ]);

  assert.deepEqual(groups.map(({ id }) => id), ['water', 'juice-soda', 'hot']);
  assert.deepEqual(groups[2].drinks.map(({ id }) => id), ['tea', 'coffee']);
});

test('legacy and unknown drink categories fall back to other drinks', () => {
  assert.equal(normalizeDrinkCategory(undefined), 'other');
  assert.equal(normalizeDrinkCategory('unknown'), 'other');
  assert.deepEqual(groupDrinksByCategory([
    { id: 'legacy', name: 'Boisson existante', desc: '', emoji: '' },
  ]).map(({ id }) => id), ['other']);
});

test('only four drinks are shown before the remaining categorized options are expanded', () => {
  const drinks = Array.from({ length: 7 }, (_, index) => ({
    id: `drink-${index + 1}`,
    name: `Boisson ${index + 1}`,
    desc: '',
    emoji: '',
    category: index % 2 === 0 ? 'water' as const : 'hot' as const,
  }));
  const { visible, remaining } = partitionDrinksForMenu(drinks);

  assert.equal(visible.length, 4);
  assert.equal(remaining.length, 3);
  assert.deepEqual([...visible, ...remaining].map(({ id }) => id), [
    'drink-1', 'drink-3', 'drink-2', 'drink-4', 'drink-5', 'drink-7', 'drink-6',
  ]);
});

test('the first four drinks use distinct categories when available and fill from remaining choices', () => {
  const drinks = [
    { id: 'water-1', name: 'Eau plate', desc: '', emoji: '', category: 'water' },
    { id: 'water-2', name: 'Eau gazeuse', desc: '', emoji: '', category: 'water' },
    { id: 'juice', name: 'Jus', desc: '', emoji: '', category: 'juice-soda' },
    { id: 'cocktail', name: 'Cocktail', desc: '', emoji: '', category: 'cocktail' },
    { id: 'hot', name: 'Café', desc: '', emoji: '', category: 'hot' },
    { id: 'other', name: 'Autre', desc: '', emoji: '', category: 'other' },
  ];
  assert.deepEqual(partitionDrinksForMenu(drinks).visible.map(({ id }) => id), [
    'water-1', 'juice', 'cocktail', 'hot',
  ]);
  assert.deepEqual(partitionDrinksForMenu(drinks.slice(0, 2)).visible.map(({ id }) => id), [
    'water-1', 'water-2',
  ]);
});

test('drink rows never leave a single last card when there are multiple drinks', () => {
  for (const count of [2, 3, 4, 5, 6, 7, 8, 9]) {
    const rows = groupDrinksIntoRows(Array.from({ length: count }, (_, index) => index));
    assert.ok(rows.every((row) => row.length >= 2), `count ${count} has a one-card row`);
    assert.equal(rows.flat().length, count);
  }
  assert.deepEqual(groupDrinksIntoRows([1, 2, 3, 4, 5]), [[1, 2, 3], [4, 5]]);
});
