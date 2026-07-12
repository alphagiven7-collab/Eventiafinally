import { EventWithSettings } from '@/types';

// Données chargées localement - ZÉRO fetch, ZÉRO filesystem
// Solution 100% fiable pour Safari iOS

import yanickKeren from '@/lib/data/yanick-keren.json';
import anniversaireGrace from '@/lib/data/anniversaire-grace.json';
import conferenceTech from '@/lib/data/conference-tech-2026.json';

const events: Record<string, EventWithSettings> = {
  'yanick-keren': yanickKeren as unknown as EventWithSettings,
  'anniversaire-grace': anniversaireGrace as unknown as EventWithSettings,
  'conference-tech-2026': conferenceTech as unknown as EventWithSettings,
};

export function getEventBySlug(slug: string): EventWithSettings | null {
  return events[slug] || null;
}

export function getAllEvents(): EventWithSettings[] {
  return Object.values(events);
}