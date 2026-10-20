import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';

export async function isCurrentSuperAdmin(userId?: string | null): Promise<boolean> {
  if (!userId || !isSupabaseReady()) return false;
  const { data } = await createClient().from('users').select('role').eq('id', userId).maybeSingle();
  return data?.role === 'super_admin';
}

export type GuestTotals = {
  sent: number;
  confirmed: number;
  pending: number;
  declined: number;
};

const EMPTY_TOTALS: GuestTotals = { sent: 0, confirmed: 0, pending: 0, declined: 0 };

export function emptyGuestTotals(): GuestTotals {
  return { ...EMPTY_TOTALS };
}

export function addGuestTotals(current: GuestTotals, status: string | null | undefined): GuestTotals {
  const next = { ...current, sent: current.sent + 1 };
  if (status === 'confirmed') next.confirmed += 1;
  else if (status === 'declined') next.declined += 1;
  else next.pending += 1;
  return next;
}

/** Toutes les invitations créées, confirmées, en attente ou refusées, par événement. */
export async function loadGuestTotalsByEvent(): Promise<Record<string, GuestTotals>> {
  if (!isSupabaseReady()) return {};
  const supabase = createClient();
  const totals: Record<string, GuestTotals> = {};
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('guests')
      .select('event_id, status')
      .range(from, from + pageSize - 1);
    if (error || !data?.length) break;
    for (const row of data) {
      const eventId = String(row.event_id || '');
      if (!eventId) continue;
      totals[eventId] = addGuestTotals(totals[eventId] || emptyGuestTotals(), row.status);
    }
    if (data.length < pageSize) break;
  }
  return totals;
}
