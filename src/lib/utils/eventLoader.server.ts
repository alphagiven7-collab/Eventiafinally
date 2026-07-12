import { EventWithSettings } from '@/types';

// Cache
const eventsCache: Map<string, EventWithSettings> = new Map();

/**
 * Charge un événement par son slug avec timeout et cache
 */
export async function loadEvent(slug: string): Promise<EventWithSettings | null> {
  if (eventsCache.has(slug)) {
    return eventsCache.get(slug) || null;
  }
  
  try {
    // Timeout de sécurité (3 secondes max)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Essayer d'abord le dossier public/data/events/
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'data', 'events', `${slug}.json`),
    ];
    
    let event: EventWithSettings | null = null;
    
    for (const filePath of possiblePaths) {
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        event = JSON.parse(fileContent) as EventWithSettings;
        eventsCache.set(slug, event);
        clearTimeout(timeout);
        return event;
      } catch {
        continue;
      }
    }
    
    clearTimeout(timeout);
    console.error(`Event not found: ${slug}`);
    return null;
  } catch (error) {
    console.error(`Error loading event ${slug}:`, error);
    return null;
  }
}

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
    } catch {
      console.error('Events directory not found');
      return [];
    }
  } catch (error) {
    console.error('Error loading events:', error);
    return [];
  }
}