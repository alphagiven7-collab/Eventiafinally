import type { GuestDraft } from './store';
import type { GuestFamilySide } from '@/types';

export type CsvRow = { line: number; cells: string[] };

function detectDelimiter(headerLine: string): string {
  const [best] = [',', ';', '\t']
    .map((d) => [d, headerLine.split(d).length - 1] as const)
    .sort((x, y) => y[1] - x[1]);
  return best[1] > 0 ? best[0] : ',';
}

/** Lit un CSV avec guillemets, retours à la ligne dans un champ et séparateur , ; ou tabulation. */
export function parseCsv(text: string): CsvRow[] {
  const clean = text.replace(/^\uFEFF/, '');
  const firstLine = clean.split(/\r?\n/).find((line) => line.trim()) || '';
  const delimiter = detectDelimiter(firstLine);
  const rows: CsvRow[] = [];
  let cells: string[] = [];
  let cell = '';
  let quoted = false;
  let line = 1;
  let rowLine = 1;

  const endRow = () => {
    cells.push(cell.trim());
    if (cells.some((value) => value)) rows.push({ line: rowLine, cells });
    cells = [];
    cell = '';
  };

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    if (quoted) {
      if (char === '"' && clean[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        if (char === '\n') line += 1;
        cell += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === delimiter) {
      cells.push(cell.trim());
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && clean[i + 1] === '\n') i += 1;
      endRow();
      line += 1;
      rowLine = line;
    } else cell += char;
  }
  endRow();
  return rows;
}

type Field = 'name' | 'phone' | 'group' | 'familySide' | 'email' | 'table' | 'adults' | 'children';

const HEADERS: Record<Field, string[]> = {
  name: ['nom', 'name', 'invite', 'invité', 'prenom', 'prénom', 'nom complet'],
  phone: ['telephone', 'téléphone', 'tel', 'tél', 'phone', 'mobile', 'whatsapp'],
  group: ['groupe', 'group', 'famille'],
  familySide: ['cote_famille', 'cote famille', 'côté famille', 'camp familial', 'famille du marié', 'famille de la mariée'],
  email: ['email', 'e-mail', 'mail', 'courriel'],
  table: ['table', 'numero de table', 'numéro de table', 'table_number'],
  adults: ['adultes', 'adults'],
  children: ['enfants', 'children'],
};

const normalize = (value: string) => value.trim().toLowerCase();

function mapHeader(cells: string[]): Partial<Record<Field, number>> | null {
  const map: Partial<Record<Field, number>> = {};
  cells.forEach((cell, index) => {
    const key = normalize(cell);
    (Object.keys(HEADERS) as Field[]).forEach((field) => {
      if (map[field] === undefined && HEADERS[field].includes(key)) map[field] = index;
    });
  });
  return map.name === undefined ? null : map;
}

export type ParsedGuests = {
  ready: GuestDraft[];
  bad: { line: number; text: string; reason: string }[];
  duplicates: string[];
};

export function parseGuestCsv(text: string, existingNames: string[] = []): ParsedGuests {
  const rows = parseCsv(text);
  const ready: GuestDraft[] = [];
  const bad: ParsedGuests['bad'] = [];
  const duplicates: string[] = [];
  if (rows.length === 0) return { ready, bad, duplicates };

  const header = mapHeader(rows[0].cells);
  const map: Partial<Record<Field, number>> = header ?? { name: 0, phone: 1, group: 2, email: 3 };
  const dataRows = header ? rows.slice(1) : rows;
  const known = new Set(existingNames.map(normalize));
  const seen = new Set<string>();
  const pick = (cells: string[], field: Field) => {
    const index = map[field];
    return index === undefined ? undefined : cells[index]?.trim() || undefined;
  };
  const count = (value?: string) => {
    const n = Number.parseInt(value || '', 10);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const familySide = (value?: string): GuestFamilySide | undefined => {
    const side = normalize(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (['marie', 'epoux', 'homme', 'groom', 'famille du marie'].includes(side)) return 'groom';
    if (['mariee', 'epouse', 'femme', 'bride', 'famille de la mariee'].includes(side)) return 'bride';
    return undefined;
  };

  dataRows.forEach(({ line, cells }) => {
    const name = pick(cells, 'name') || '';
    if (!name || normalize(name) === 'sans nom') {
      bad.push({ line, text: cells.join(' | '), reason: 'Nom manquant' });
      return;
    }
    const key = normalize(name);
    if (known.has(key) || seen.has(key)) {
      duplicates.push(`${name} (ligne ${line})`);
      return;
    }
    seen.add(key);
    ready.push({
      name,
      phone: pick(cells, 'phone'),
      group: pick(cells, 'group'),
      familySide: familySide(pick(cells, 'familySide')),
      email: pick(cells, 'email'),
      tableNumber: pick(cells, 'table'),
      adults: count(pick(cells, 'adults')),
      children: count(pick(cells, 'children')),
    });
  });
  return { ready, bad, duplicates };
}
