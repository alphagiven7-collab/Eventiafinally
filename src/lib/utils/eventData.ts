import { EventWithSettings } from '@/types';

// Import statique des données JSON - plus fiable que fetch() sur Safari
const eventsMap: Record<string, EventWithSettings> = {};

// On les importe au build time, pas au runtime
const eventFiles = import.meta.glob('/public/data/events/*.json', { eager: true, query: '?raw', import: 'default' });

// Remplir le cache
Object.entries(eventFiles).forEach(([path, content]: [string, any]) => {
  try {
    const slug = path.split('/').pop()?.replace('.json', '');
    if (slug && slug !== '_template') {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      eventsMap[slug] = parsed as EventWithSettings;
    }
  } catch (e) {
    console.error('Error parsing event file:', path, e);
  }
});

/**
 * Charge un événement - VERSION STATIQUE (pas de fetch, pas de filesystem)
 * 100% fiable sur Safari iOS
 */
export function getEvent(slug: string): EventWithSettings | null {
  if (eventsMap[slug]) return eventsMap[slug];
  console.error(`Event not found: ${slug}`);
  return null;
}

/**
 * Récupère tous les événements disponibles
 */
export function getAllEvents(): EventWithSettings[] {
  return Object.values(eventsMap);
}