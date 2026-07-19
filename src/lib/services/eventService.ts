// ============================================
// INVITIA - Event Service
// Point d'entrée unique pour les événements
// ============================================

import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';
import { EventWithSettings, EventInput, GuestInput } from '@/types';

// ============================================
// Événements statiques (fallback)
// ============================================

import { events as staticEvents, getEventBySlug } from '@/data/events';

// ============================================
// Récupération
// ============================================

export async function fetchEvent(slug: string): Promise<EventWithSettings | null> {
  if (!isSupabaseReady()) return getEventBySlug(slug);

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('events')
      .select('*, event_settings(*)')
      .eq('slug', slug)
      .single();

    if (error || !data) return getEventBySlug(slug);
    return data as EventWithSettings;
  } catch {
    return getEventBySlug(slug);
  }
}

export async function fetchUserEvents(userId: string): Promise<EventWithSettings[]> {
  if (!isSupabaseReady()) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (data as EventWithSettings[]) || [];
}

// ============================================
// Création
// ============================================

export async function createEvent(input: EventInput & { userId: string }): Promise<string | null> {
  const slug = input.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    + '-' + Date.now().toString(36).slice(-4);

  if (!isSupabaseReady()) return slug;

  const supabase = createClient();
  const { error } = await supabase.from('events').insert({
    slug,
    title: input.title,
    user_id: input.userId,
    event_type: input.eventType,
    event_date: input.eventDate,
    event_time: input.eventTime || null,
    location: input.location,
    address: input.address || null,
    description: input.description || null,
    is_published: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Erreur création événement:', error);
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