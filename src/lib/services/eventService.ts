// ============================================
// INVITIA - Event Service
// Point d'entrée unique pour les événements
// ============================================

import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';
import { EventWithSettings, EventInput, GuestInput } from '@/types';
import { fetchInvitationBySlug, listInvitations, publishInvitation } from '@/lib/events/store';
import { getEventBySlug } from '@/data/events';

// ============================================
// Récupération
// ============================================

export async function fetchEvent(slug: string): Promise<EventWithSettings | null> {
  if (!isSupabaseReady()) return getEventBySlug(slug);

  try {
    const hosted = await fetchInvitationBySlug(createClient(), slug);
    return hosted ?? getEventBySlug(slug);
  } catch {
    return getEventBySlug(slug);
  }
}

export async function fetchUserEvents(userId: string): Promise<EventWithSettings[]> {
  if (!isSupabaseReady()) return [];
  return listInvitations(createClient(), userId);
}

// ============================================
// Création
// ============================================

export async function createEvent(input: EventInput & { userId: string }): Promise<string | null> {
  if (!isSupabaseReady()) return null;

  const slug = input.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    + '-' + Date.now().toString(36).slice(-4);

  const now = new Date().toISOString();
  const result = await publishInvitation(createClient(), {
    id: crypto.randomUUID(),
    slug,
    title: input.title,
    subtitle: input.subtitle,
    type: input.eventType,
    event_date: input.eventDate,
    event_time: input.eventTime,
    location: input.location,
    address: input.address,
    description: input.description,
    cover_image: input.coverImage,
    user_id: input.userId,
    is_published: false,
    view_count: 0,
    created_at: now,
    updated_at: now,
  });

  if (result.error) {
    console.error('Erreur création événement:', result.error);
    return null;
  }
  return slug;
}

// ============================================
// RSVP
// ============================================

export async function submitRsvp(
  eventId: string,
  data: { guestName: string; guests: number; message?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady()) {
    if (typeof window !== 'undefined') {
      const rsvps = JSON.parse(localStorage.getItem(`rsvps_${eventId}`) || '[]');
      rsvps.push({ ...data, responded_at: new Date().toISOString() });
      localStorage.setItem(`rsvps_${eventId}`, JSON.stringify(rsvps));
    }
    return { success: true };
  }

  const supabase = createClient();
  const { error } = await supabase.from('rsvps').insert({
    event_id: eventId,
    status: 'confirmed',
    adults: data.guests,
    message: data.message || null,
    responded_at: new Date().toISOString(),
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}