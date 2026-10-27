import { SupabaseClient } from '@supabase/supabase-js';
import { freeGuestLimitMessage, guestCapacity } from '@/constants/pricing';
import { isUuid } from '@/lib/events/store';
import { Guest, GuestFamilySide, GuestStatus } from '@/types';

type GuestRow = {
  id: string;
  event_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  group_name: string | null;
  family_side?: GuestFamilySide | null;
  adults: number | null;
  children: number | null;
  status: GuestStatus;
  token: string;
  message: string | null;
  drink_preferences?: string | null;
  table_number: string | null;
  checked_in_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicGuest = {
  id: string;
  event_id: string;
  name: string;
  status: GuestStatus;
  adults: number;
  children: number;
  token: string;
  table_number?: string;
};

export type GuestDraft = {
  name: string;
  phone?: string;
  email?: string;
  group?: string;
  familySide?: GuestFamilySide;
  adults?: number;
  children?: number;
  tableNumber?: string;
};

export const CHECKIN_PREFIX = 'invitia:checkin:';

const MIGRATION_HINT = 'Service momentanément indisponible. Réessayez plus tard.';
const FAMILY_SIDE_MIGRATION_HINT =
  'Le classement familial n’est pas activé dans la base. Appliquez supabase/migrations/020_guest_family_side.sql, puis rechargez la page.';

export function checkinPayload(token: string): string {
  return `${CHECKIN_PREFIX}${token}`;
}

export function guestInvitePath(slug: string, guest: Pick<Guest, 'name' | 'token'>): string {
  const params = new URLSearchParams({ guest: guest.name, token: guest.token });
  return `/e/${slug}?${params.toString()}`;
}

export function tokenFromInviteLink(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith(CHECKIN_PREFIX)) return trimmed.slice(CHECKIN_PREFIX.length).trim();
  try {
    const url = new URL(trimmed);
    return url.searchParams.get('token') || trimmed;
  } catch {
    return trimmed;
  }
}

export function explainGuestError(message: string): string {
  if (!message.trim()) return 'Ça n’a pas marché. Réessayez.';
  if (message.includes('FREE_GUEST_LIMIT')) return freeGuestLimitMessage();
  if (/not assigned yet|GUEST_NOT_FOUND/i.test(message)) return 'Ce lien ne correspond à aucun invité.';
  if (message.includes('EVENT_NOT_PUBLISHED')) return 'Cette invitation n’est pas encore ouverte.';
  if (
    /family_side|guests_family_side_check/i.test(message) &&
    /column|schema cache|constraint|check/i.test(message)
  ) {
    return FAMILY_SIDE_MIGRATION_HINT;
  }
  if (/row-level security|permission denied/i.test(message)) {
    return 'La confirmation n’a pas été autorisée. Réessayez plus tard.';
  }
  if (/schema cache|could not find the function|submit_guest_rsvp|lookup_guest_by_token|argument of NOT must be type boolean/i.test(message)) {
    return MIGRATION_HINT;
  }
  if (/column|ambiguous/i.test(message)) return MIGRATION_HINT;
  return message;
}

export function toGuest(row: GuestRow): Guest {
  return {
    id: row.id,
    event_id: row.event_id,
    name: row.name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    group: row.group_name ?? undefined,
    family_side: row.family_side ?? undefined,
    status: row.status,
    adults: row.adults ?? 1,
    children: row.children ?? 0,
    table_number: row.table_number ?? undefined,
    message: row.message ?? undefined,
    drink_preferences: row.drink_preferences ?? undefined,
    token: row.token,
    checked_in_at: row.checked_in_at ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function newToken(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function draftRow(eventId: string, draft: GuestDraft) {
  return {
    id: crypto.randomUUID(),
    event_id: eventId,
    name: draft.name.trim(),
    phone: draft.phone?.trim() || null,
    email: draft.email?.trim() || null,
    group_name: draft.group?.trim() || null,
    family_side: draft.familySide ?? null,
    adults: draft.adults ?? 1,
    children: draft.children ?? 0,
    table_number: draft.tableNumber?.trim() || null,
    status: 'pending' as const,
    token: newToken(),
  };
}

export async function listGuests(client: SupabaseClient, eventId: string): Promise<{ guests: Guest[]; error?: string }> {
  const { data, error } = await client
    .from('guests')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) return { guests: [], error: explainGuestError(error.message) };
  return { guests: ((data ?? []) as GuestRow[]).map(toGuest) };
}

export async function listAllEventGuests(
  client: SupabaseClient,
  eventId: string,
): Promise<{ guests: Guest[]; error?: string }> {
  const pageSize = 1000;
  const guests: Guest[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from('guests')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) return { guests: [], error: explainGuestError(error.message) };
    const rows = ((data ?? []) as GuestRow[]).map(toGuest);
    guests.push(...rows);
    if (rows.length < pageSize) break;
  }
  return { guests };
}

export async function countGuests(client: SupabaseClient, eventId: string): Promise<number> {
  const { count, error } = await client
    .from('guests')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId);
  if (error) return 0;
  return count ?? 0;
}

export async function addGuest(
  client: SupabaseClient,
  eventId: string,
  draft: GuestDraft,
  limit = guestCapacity(),
): Promise<{ guest?: Guest; error?: string }> {
  if (!isUuid(eventId)) return { error: 'Enregistrez d\'abord l\'invitation pour ajouter des invités.' };
  if (!draft.name.trim()) return { error: 'Le nom est obligatoire.' };

  const taken = await countGuests(client, eventId);
  if (taken >= limit) return { error: freeGuestLimitMessage(limit) };

  const { data, error } = await client
    .from('guests')
    .insert(draftRow(eventId, draft))
    .select('*')
    .single();

  if (error) return { error: explainGuestError(error.message) };
  return { guest: toGuest(data as GuestRow) };
}

export async function addGuests(
  client: SupabaseClient,
  eventId: string,
  drafts: GuestDraft[],
  limit = guestCapacity(),
): Promise<{ guests: Guest[]; error?: string; truncated: boolean }> {
  if (!isUuid(eventId)) return { guests: [], error: 'Enregistrez d\'abord l\'invitation pour ajouter des invités.', truncated: false };

  const named = drafts.filter((draft) => draft.name.trim());
  if (named.length === 0) return { guests: [], error: 'Aucun invité trouvé dans le fichier.', truncated: false };

  const taken = await countGuests(client, eventId);
  const room = limit - taken;
  if (room <= 0) return { guests: [], error: freeGuestLimitMessage(limit), truncated: true };

  const accepted = named.slice(0, room);
  const { data, error } = await client
    .from('guests')
    .insert(accepted.map((draft) => draftRow(eventId, draft)))
    .select('*');

  if (error) return { guests: [], error: explainGuestError(error.message), truncated: accepted.length < named.length };
  return {
    guests: ((data ?? []) as GuestRow[]).map(toGuest),
    truncated: accepted.length < named.length,
    error: accepted.length < named.length ? freeGuestLimitMessage(limit) : undefined,
  };
}

export async function updateGuest(
  client: SupabaseClient,
  guest: Guest,
): Promise<{ guest?: Guest; error?: string }> {
  const { data, error } = await client
    .from('guests')
    .update({
      name: guest.name.trim(),
      phone: guest.phone?.trim() || null,
      email: guest.email?.trim() || null,
      group_name: guest.group?.trim() || null,
      family_side: guest.family_side ?? null,
      status: guest.status,
      adults: guest.adults ?? 1,
      children: guest.children ?? 0,
      table_number: guest.table_number?.trim() || null,
      message: guest.message?.trim() || null,
    })
    .eq('id', guest.id)
    .select('*')
    .single();

  if (error) return { error: explainGuestError(error.message) };
  return { guest: toGuest(data as GuestRow) };
}

export async function deleteGuest(client: SupabaseClient, guestId: string): Promise<{ error?: string }> {
  const { error } = await client.from('guests').delete().eq('id', guestId);
  if (error) return { error: explainGuestError(error.message) };
  return {};
}

export async function lookupGuestByToken(client: SupabaseClient, token: string): Promise<PublicGuest | null> {
  const { data, error } = await client.rpc('lookup_guest_by_token', { p_token: token });
  if (error || !Array.isArray(data) || data.length === 0) return null;
  const row = data[0] as PublicGuest;
  return {
    id: row.id,
    event_id: row.event_id,
    name: row.name,
    status: row.status,
    adults: row.adults ?? 1,
    children: row.children ?? 0,
    token: row.token,
    table_number: (row as PublicGuest & { table_number?: string }).table_number || undefined,
  };
}

export async function listGuestbook(
  client: SupabaseClient,
  slug: string,
  limit = 3,
): Promise<{ guest_name: string; message: string }[]> {
  const limited = await client.rpc('list_event_guestbook', { p_slug: slug, p_limit: limit });
  const result = limited.error
    ? await client.rpc('list_event_guestbook', { p_slug: slug })
    : limited;
  if (result.error || !Array.isArray(result.data)) return [];
  const notes = result.data as { guest_name: string; message: string }[];
  return limit > 0 ? notes.slice(0, limit) : notes;
}

export type CheckInResult = {
  name: string;
  tableNumber?: string;
  status?: string;
  alreadyInside: boolean;
};

export async function checkInGuest(
  client: SupabaseClient,
  token: string,
  eventId: string,
): Promise<{ guest?: CheckInResult; error?: string; wrongEvent?: boolean }> {
  let { data, error } = await client.rpc('check_in_guest', { p_token: token, p_event_id: eventId });
  // Avant la mise à jour de la base, seule l'ancienne fonction existe : la page a déjà vérifié le mariage.
  if (error && /schema cache|could not find the function/i.test(error.message)) {
    ({ data, error } = await client.rpc('check_in_guest', { p_token: token }));
  }
  if (error) {
    if (error.message.includes('WRONG_EVENT')) return { wrongEvent: true };
    if (error.message.includes('NOT_ALLOWED')) return { error: 'Seul le propriétaire du mariage peut accueillir les invités.' };
    return { error: explainGuestError(error.message) };
  }
  const row = (Array.isArray(data) ? data[0] : data) as {
    guest_name?: string;
    table_number?: string | null;
    guest_status?: string;
    already_inside?: boolean;
  } | null;
  if (!row?.guest_name) return { error: 'Invité introuvable.' };
  return {
    guest: {
      name: row.guest_name,
      tableNumber: row.table_number || undefined,
      status: row.guest_status,
      alreadyInside: Boolean(row.already_inside),
    },
  };
}

export async function submitGuestRsvp(
  client: SupabaseClient,
  input: { token: string; status: 'confirmed' | 'declined'; adults?: number; children?: number; message?: string },
): Promise<{ name?: string; status?: string; error?: string }> {
  const { data, error } = await client.rpc('submit_guest_rsvp', {
    p_token: input.token,
    p_status: input.status,
    p_adults: input.adults ?? 1,
    p_children: input.children ?? 0,
    p_message: input.message ?? null,
  });

  if (error) return { error: explainGuestError(error.message) };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.guest_status && !row?.guest_name) {
    return { error: 'Ça n’a pas été enregistré. Réessayez.' };
  }
  return { name: row?.guest_name, status: row?.guest_status || input.status };
}

export async function saveGuestDrinks(
  client: SupabaseClient,
  input: { token: string; drinks: string[] },
): Promise<{ error?: string }> {
  const drinks = input.drinks.filter((id) => typeof id === 'string' && id.trim()).slice(0, 12);
  const { error } = await client.rpc('save_guest_drinks', {
    p_token: input.token,
    p_drinks: drinks.join(','),
  });
  if (error) return { error: explainGuestError(error.message) };
  return {};
}
