import type { GuestFamilySide } from '@/types';

export function normalizeGuestName(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase('fr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function isCoupleName(name: string): boolean {
  return /\s(?:&|\+|et|and)\s/i.test(name.trim());
}

export function seatsAtTable(guest: { name: string; adults?: number; table_number?: string }): number {
  if (!guest.table_number?.trim()) return 0;
  const adults = guest.adults && guest.adults > 0 ? guest.adults : 1;
  if (adults >= 2) return adults;
  if (isCoupleName(guest.name)) return 2;
  return 1;
}

type DuplicateGuest = {
  id: string;
  name: string;
  phone?: string;
  family_side?: GuestFamilySide;
  table_number?: string;
  created_at?: string;
};

export function duplicateIdsToRemove(guests: DuplicateGuest[]): string[] {
  const groups = new Map<string, DuplicateGuest[]>();
  for (const guest of guests) {
    const key = `${guest.family_side || 'unassigned'}:${normalizeGuestName(guest.name)}`;
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(guest);
    groups.set(key, list);
  }

  const remove: string[] = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const ranked = [...group].sort((a, b) => {
      const score = (item: DuplicateGuest) => (item.table_number?.trim() ? 2 : 0) + (item.phone?.trim() ? 1 : 0);
      const diff = score(b) - score(a);
      if (diff !== 0) return diff;
      return (a.created_at || '').localeCompare(b.created_at || '');
    });
    remove.push(...ranked.slice(1).map((guest) => guest.id));
  }
  return remove;
}
