import assert from 'node:assert/strict';
import test from 'node:test';
import { parseGuestCsv } from '../src/lib/guests/csv.ts';

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
