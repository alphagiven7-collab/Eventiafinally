import { EventWithSettings } from '@/types';

// Cache pour éviter de recharger les fichiers
let eventsCache: Map<string, EventWithSettings> = new Map();

/**
 * Charge un événement par son slug - VERSION SERVEUR
 */
export async function loadEvent(slug: string): Promise<EventWithSettings | null> {
  // Vérifier le cache d'abord
  if (eventsCache.has(slug)) {
    return eventsCache.get(slug) || null;
  }
  
  try {
    // Lire le fichier JSON directement depuis le filesystem (côté serveur)
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const filePath = path.join(process.cwd(), 'public', 'data', 'events', `${slug}.json`);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const event = JSON.parse(fileContent) as EventWithSettings;
      eventsCache.set(slug, event);
      return event;
    } catch (fileError) {
      console.error(`Event file not found: ${slug}`);
      return null;
    }
  } catch (error) {
    console.error(`Error loading event ${slug}:`, error);
    return null;
  }
}

/**
 * Charge tous les événements - VERSION SERVEUR
 */
export async function loadAllEvents(): Promise<EventWithSettings[]> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const eventsDir = path.join(process.cwd(), 'public', 'data', 'events');
    
    try {
      const files = await fs.readdir(eventsDir);
      const eventFiles = files.filter(file => file.endsWith('.json'));
      
      const events: EventWithSettings[] = [];
      
      for (const file of eventFiles) {
        const slug = file.replace('.json', '');
        const event = await loadEvent(slug);
        if (event) {
          events.push(event);
        }
      }
      
      return events;
    } catch (dirError) {
      console.error('Events directory not found');
      return [];
    }
  } catch (error) {
    console.error('Error loading events:', error);
    return [];
  }
}