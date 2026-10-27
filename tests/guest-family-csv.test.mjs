import assert from 'node:assert/strict';
import test from 'node:test';
import { parseGuestCsv } from '../src/lib/guests/csv.ts';
import { duplicateIdsToRemove } from '../src/lib/guests/seating.ts';

test('CSV import assigns guests to the bride or groom family', () => {
  const result = parseGuestCsv(
    'nom,cote_famille\nJean,marié\nMarie,Famille de la mariée',
  );

  assert.deepEqual(result.ready.map(({ name, familySide }) => [name, familySide]), [
    ['Jean', 'groom'],
    ['Marie', 'bride'],
  ]);
});

test('CSV import leaves unknown family labels unassigned', () => {
  const result = parseGuestCsv('nom,cote_famille\nAlex,amis');

  assert.equal(result.ready[0]?.familySide, undefined);
});

test('the existing family group column remains a free-form group', () => {
  const result = parseGuestCsv('nom,famille\nCamille,Cousins');

  assert.equal(result.ready[0]?.group, 'Cousins');
  assert.equal(result.ready[0]?.familySide, undefined);
});

test('CSV import treats the same name on opposite family sides as distinct guests', () => {
  const acrossFamilies = parseGuestCsv('nom,cote_famille\nAlex,marié\nAlex,mariée');
  assert.deepEqual(acrossFamilies.ready.map(({ familySide }) => familySide), ['groom', 'bride']);
  assert.equal(acrossFamilies.duplicates.length, 0);

  const result = parseGuestCsv(
    'nom,cote_famille\nAlex,marié\nAlex,mariée',
    [{ name: 'Alex', family_side: 'bride' }],
  );

  assert.deepEqual(result.ready.map(({ name, familySide }) => [name, familySide]), [
    ['Alex', 'groom'],
  ]);
  assert.match(result.duplicates[0], /famille de la mariée/);
});

test('CSV import applies the selected family default and explicit CSV values take precedence', () => {
  const result = parseGuestCsv(
    'nom,cote_famille\nAlex,\nSam,mariée',
    [],
    'groom',
  );

  assert.deepEqual(result.ready.map(({ familySide }) => familySide), ['groom', 'bride']);
});

test('removing duplicates keeps the same name once on each family side', () => {
  const duplicateIds = duplicateIdsToRemove([
    { id: 'groom-1', name: 'Alex', family_side: 'groom' },
    { id: 'bride-1', name: 'Alex', family_side: 'bride' },
    { id: 'groom-2', name: 'Alex', family_side: 'groom' },
  ]);

  assert.deepEqual(duplicateIds, ['groom-2']);
});
