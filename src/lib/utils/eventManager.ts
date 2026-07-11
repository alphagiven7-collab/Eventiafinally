'use client';

import { createClient } from '@/lib/supabase/client';
import { EventWithSettings, Guest } from '@/types';

// Store en mémoire pour cache (optionnel, pour performance)
let eventsCache: Map<string, EventWithSettings> = new Map();

/**
 * Crée un nouvel événement à partir d'un template
 */
export async function createEventFromTemplate(
  templateSlug: string,
  customName: string,
  userId?: string
): Promise<EventWithSettings | null> {
  try {
    const supabase = createClient();
    
    // Charger le template
    const template = await loadTemplate(templateSlug);
    if (!template) return null;

    // Générer un nouveau slug
    const newSlug = customName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now().toString(36).slice(-4);

    const now = new Date().toISOString();

    // Créer le nouvel événement
    const newEvent: EventWithSettings = {
      ...template,
      id: newSlug,
      slug: newSlug,
      title: customName,
      subtitle: customName,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    // Sauvegarder dans Supabase si userId
    if (userId) {
      const { error } = await supabase
        .from('events')
        .insert({
          slug: newSlug,
          title: customName,
          subtitle: customName,
          user_id: userId,
          template_slug: templateSlug,
          data: newEvent,
          created_at: now,
          updated_at: now,
        });

      if (error) {
        console.error('Erreur Supabase:', error);
      }
    }

    // Fallback localStorage
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('created_events') || '{}');
      stored[newSlug] = newEvent;
      localStorage.setItem('created_events', JSON.stringify(stored));
    }

    eventsCache.set(newSlug, newEvent);
    return newEvent;
  } catch (error) {
    console.error('Error creating event:', error);
    return null;
  }
}

/**
 * Charge un événement
 */
export async function loadEvent(slug: string): Promise<EventWithSettings | null> {
  // 1. Vérifier le cache
  if (eventsCache.has(slug)) {
    return eventsCache.get(slug) || null;
  }

  try {
    const supabase = createClient();
    
    // 2. Essayer Supabase d'abord
    const { data, error } = await supabase
      .from('events')
      .select('data')
      .eq('slug', slug)
      .single();

    if (!error && data?.data) {
      const event = data.data as EventWithSettings;
      eventsCache.set(slug, event);
      return event;
    }
  } catch (e) {
    // Continue avec localStorage/template
  }

  // 3. Fallback localStorage
  if (typeof window !== 'undefined') {
    const stored = JSON.parse(localStorage.getItem('created_events') || '{}');
    if (stored[slug]) {
      eventsCache.set(slug, stored[slug]);
      return stored[slug];
    }
  }

  // 4. Charger depuis les templates
  return loadTemplate(slug);
}

/**
 * Sauvegarde un événement
 */
export async function saveEvent(event: EventWithSettings): Promise<boolean> {
  try {
    eventsCache.set(event.slug, event);

    // LocalStorage fallback
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('created_events') || '{}');
      stored[event.slug] = event;
      localStorage.setItem('created_events', JSON.stringify(stored));
    }

    // Supabase si user_id présent
    if (event.user_id) {
      const supabase = createClient();
      const { error } = await supabase
        .from('events')
        .upsert({
          slug: event.slug,
          data: event,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'slug' });

      if (error) console.error('Supabase save error:', error);
    }

    return true;
  } catch (error) {
    console.error('Error saving event:', error);
    return false;
  }
}

/**
 * Charge un template depuis public/data/events
 */
async function loadTemplate(slug: string): Promise<EventWithSettings | null> {
  try {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/data/events/${slug}.json`);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error loading template ${slug}:`, error);
    return null;
  }
}

/**
 * Récupère un invité par son ID
 */
export function getGuest(eventSlug: string, guestId: string): Guest | null {
  const stored = localStorage.getItem(`guests_${eventSlug}`);
  const guests = stored ? JSON.parse(stored) : [];
  return guests.find((g: Guest) => g.id === guestId) || null;
}

/**
 * Récupère tous les invités d'un événement
 */
export function getGuests(eventSlug: string): Guest[] {
  const stored = localStorage.getItem(`guests_${eventSlug}`);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Sauvegarde un invité
 */
export function saveGuest(eventSlug: string, guest: Guest): boolean {
  try {
    const guests = getGuests(eventSlug);
    const existingIndex = guests.findIndex((g: Guest) => g.id === guest.id);
    
    guest.updated_at = new Date().toISOString();
    
    if (existingIndex >= 0) {
      guests[existingIndex] = guest;
    } else {
      guests.push(guest);
    }
    
    localStorage.setItem(`guests_${eventSlug}`, JSON.stringify(guests));
    return true;
  } catch (error) {
    console.error('Error saving guest:', error);
    return false;
  }
}

/**
 * Supprime un invité
 */
export function deleteGuest(eventSlug: string, guestId: string): boolean {
  try {
    const guests = getGuests(eventSlug);
    const filtered = guests.filter((g: Guest) => g.id !== guestId);
    localStorage.setItem(`guests_${eventSlug}`, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting guest:', error);
    return false;
  }
}