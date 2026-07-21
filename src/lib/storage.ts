import localforage from 'localforage';
import { EventWithSettings } from '@/types';

// ============================================
// Storage Service — IndexedDB via localforage
// Remplace localStorage pour les gros fichiers (photos base64)
// ============================================

const eventStore = localforage.createInstance({
  name: 'invitia',
  storeName: 'events',
  description: 'Stockage des événements InVitia',
});

const photoStore = localforage.createInstance({
  name: 'invitia',
  storeName: 'photos',
  description: 'Stockage des photos compressées',
});

// ============================================
// Events
// ============================================

export async function saveUserEvents(userId: string, events: EventWithSettings[]): Promise<void> {
  await eventStore.setItem(`events_${userId}`, events);
}

export async function getUserEvents(userId: string): Promise<EventWithSettings[]> {
  const events = await eventStore.getItem<EventWithSettings[]>(`events_${userId}`);
  return events || [];
}

export async function saveEvent(userId: string, event: EventWithSettings): Promise<void> {
  const events = await getUserEvents(userId);
  const index = events.findIndex((e) => e.id === event.id);
  if (index >= 0) {
    events[index] = event;
  } else {
    events.unshift(event);
  }
  await saveUserEvents(userId, events);
}

export async function deleteEvent(userId: string, eventId: string): Promise<void> {
  const events = await getUserEvents(userId);
  const filtered = events.filter((e) => e.id !== eventId);
  await saveUserEvents(userId, filtered);
}

export async function getEventBySlug(userId: string, slug: string): Promise<EventWithSettings | null> {
  const events = await getUserEvents(userId);
  return events.find((e) => e.slug === slug) || null;
}

// ============================================
// Photos — stockées séparément pour éviter la limite de taille
// ============================================

export async function savePhoto(eventId: string, photoId: string, dataUrl: string): Promise<void> {
  await photoStore.setItem(`photo_${eventId}_${photoId}`, dataUrl);
}

export async function getPhoto(eventId: string, photoId: string): Promise<string | null> {
  return await photoStore.getItem<string>(`photo_${eventId}_${photoId}`);
}

export async function deletePhotos(eventId: string): Promise<void> {
  const keys = await photoStore.keys();
  const photoKeys = keys.filter((k) => k.startsWith(`photo_${eventId}_`));
  await Promise.all(photoKeys.map((k) => photoStore.removeItem(k)));
}

// ============================================
// Migration — transférer les anciennes données localStorage vers IndexedDB
// ============================================

export async function migrateFromLocalStorage(userId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const oldEvents = localStorage.getItem('invitia_demo_events');
  if (!oldEvents) return;

  try {
    const events = JSON.parse(oldEvents) as EventWithSettings[];
    // Filtrer par userId
    const userEvents = events.filter((e) => e.user_id === userId || e.user_id === 'demo_user');
    if (userEvents.length > 0) {
      await saveUserEvents(userId, userEvents);
    }
    // Nettoyer l'ancien stockage
    localStorage.removeItem('invitia_demo_events');
  } catch {
    // Ignore si parsing échoue
  }
}