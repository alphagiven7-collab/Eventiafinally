import { EventWithSettings } from '@/types';

// Cache pour éviter de recharger les fichiers
let eventsCache: Map<string, EventWithSettings> = new Map();

/**
 * Charge tous les événements depuis le dossier public/data/events
 */
export async function loadAllEvents(): Promise<EventWithSettings[]> {
  try {
    const events: EventWithSettings[] = [];
    
    // Liste statique des événements (à mettre à jour quand on ajoute des fichiers)
    const eventSlugs = ['yanick-keren', 'anniversaire-grace', 'conference-tech-2026'];
    
    for (const slug of eventSlugs) {
      const event = await loadEventBySlug(slug);
      if (event) {
        events.push(event);
      }
    }
    
    return events;
  } catch (error) {
    console.error('Error loading events:', error);
    return [];
  }
}

/**
 * Charge un événement par son slug depuis public/data/events
 */
export async function loadEventBySlug(slug: string): Promise<EventWithSettings | null> {
  // Vérifier le cache d'abord
  if (eventsCache.has(slug)) {
    return eventsCache.get(slug) || null;
  }
  
  try {
    // Récupérer l'URL de base (fonctionne en SSR et client)
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Fetch depuis public folder (fonctionne en SSR et client)
    const response = await fetch(`${baseUrl}/data/events/${slug}.json`);
    
    if (!response.ok) {
      console.error(`Event not found: ${slug}`);
      return null;
    }
    
    const event = await response.json() as EventWithSettings;
    eventsCache.set(slug, event);
    return event;
  } catch (error) {
    console.error(`Error loading event ${slug}:`, error);
    return null;
  }
}

/**
 * Formate une date pour l'affichage
 */
export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Calcule le countdown vers une date
 */
export function getCountdown(targetDate: string) {
  const target = new Date(targetDate).getTime();
  const now = new Date().getTime();
  const diff = target - now;
  
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true
    };
  }
  
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    isPast: false
  };
}

/**
 * Génère un token unique pour un invité
 */
export function generateGuestToken(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const random = Math.random().toString(36).substring(2, 8);
  return `${slug}-${random}`;
}

/**
 * Encode/décode un token pour les URLs
 */
export function encodeToken(token: string): string {
  return Buffer.from(token).toString('base64url');
}

export function decodeToken(encoded: string): string {
  return Buffer.from(encoded, 'base64url').toString('utf-8');
}

/**
 * Génère un lien d'invitation unique
 */
export function generateInviteLink(
  eventSlug: string,
  guestToken: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
): string {
  const encodedToken = encodeToken(guestToken);
  return `${baseUrl}/e/${eventSlug}?guest=${encodedToken}`;
}

/**
 * Parse un paramètre de recherche
 */
export function parseQueryParams(query: string): Record<string, string> {
  const params = new URLSearchParams(query);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}

/**
 * Génère un lien d'invitation pour un invité
 */
export function generateGuestLink(eventSlug: string, guestToken: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return `${baseUrl}/e/${eventSlug}?guest=${encodeURIComponent(guestToken)}`;
}
