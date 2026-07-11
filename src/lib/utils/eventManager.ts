'use client';

import { EventWithSettings, Guest } from '@/types';

// Store pour gérer les événements créés (en attendant Supabase)
let eventsStore: Map<string, EventWithSettings> = new Map();

/**
 * Crée un nouvel événement à partir d'un template
 */
export async function createEventFromTemplate(
  templateSlug: string,
  customName: string
): Promise<EventWithSettings | null> {
  try {
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

    // Créer le nouvel événement avec les données du template
    const newEvent: EventWithSettings = {
      ...template,
      id: newSlug,
      slug: newSlug,
      title: customName,
      subtitle: customName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Sauvegarder dans le store
    eventsStore.set(newSlug, newEvent);

    // Sauvegarder dans localStorage (temporaire, en attendant Supabase)
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('created_events') || '{}');
      stored[newSlug] = newEvent;
      localStorage.setItem('created_events', JSON.stringify(stored));
    }

    return newEvent;
  } catch (error) {
    console.error('Error creating event:', error);
    return null;
  }
}

/**
 * Charge un événement (template ou événement créé)
 */
export async function loadEvent(slug: string): Promise<EventWithSettings | null> {
  // 1. Vérifier dans les événements créés
  if (eventsStore.has(slug)) {
    return eventsStore.get(slug) || null;
  }

  // 2. Vérifier dans localStorage
  if (typeof window !== 'undefined') {
    const stored = JSON.parse(localStorage.getItem('created_events') || '{}');
    if (stored[slug]) {
      eventsStore.set(slug, stored[slug]);
      return stored[slug];
    }
  }

  // 3. Charger depuis les templates
  return loadTemplate(slug);
}

/**
 * Sauvegarde un événement
 */
export async function saveEvent(event: EventWithSettings): Promise<boolean> {
  try {
    eventsStore.set(event.slug, event);

    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('created_events') || '{}');
      stored[event.slug] = event;
      localStorage.setItem('created_events', JSON.stringify(stored));
    }

    // TODO: Sauvegarder dans Supabase
    console.log('Event saved:', event.slug);
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
 * Liste tous les événements créés par l'utilisateur
 */
export function getUserEvents(): EventWithSettings[] {
  if (typeof window === 'undefined') return [];
  
  const stored = JSON.parse(localStorage.getItem('created_events') || '{}');
  return Object.values(stored);
}

/**
 * Supprime un événement
 */
export async function deleteEvent(slug: string): Promise<boolean> {
  try {
    eventsStore.delete(slug);

    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('created_events') || '{}');
      delete stored[slug];
      localStorage.setItem('created_events', JSON.stringify(stored));
    }

    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
}

/**
 * Récupère un invité par son ID
 */
export function getGuest(eventSlug: string, guestId: string): Guest | null {
  if (typeof window === 'undefined') return null;
  
  const guests = getGuests(eventSlug);
  return guests.find(g => g.id === guestId) || null;
}

/**
 * Récupère tous les invités d'un événement
 */
export function getGuests(eventSlug: string): Guest[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(`guests_${eventSlug}`);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Sauvegarde un invité
 */
export function saveGuest(eventSlug: string, guest: Guest): boolean {
  try {
    const guests = getGuests(eventSlug);
    const existingIndex = guests.findIndex(g => g.id === guest.id);
    
    if (existingIndex >= 0) {
      guests[existingIndex] = { ...guest, updated_at: new Date().toISOString() };
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
    const filtered = guests.filter(g => g.id !== guestId);
    localStorage.setItem(`guests_${eventSlug}`, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting guest:', error);
    return false;
  }
}
