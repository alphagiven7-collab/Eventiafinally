/**
 * Script de migration des données localStorage vers Supabase
 */

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface MigrationResult {
  eventId: string;
  guests: { success: number; failed: number };
  checkins: { success: number; failed: number };
}

/**
 * Migre les données localStorage d'un événement vers Supabase
 */
export async function migrateEventToSupabase(eventId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    eventId,
    guests: { success: 0, failed: 0 },
    checkins: { success: 0, failed: 0 }
  };

  try {
    // Migrer les invités
    const guestsKey = `guests_${eventId}`;
    const guestsData = localStorage.getItem(guestsKey);
    
    if (guestsData) {
      const guests = JSON.parse(guestsData);
      for (const guest of guests) {
        try {
          const { error } = await supabase
            .from('guests')
            .upsert({
              ...guest,
              event_id: eventId,
              updated_at: new Date().toISOString()
            });

          if (error) throw error;
          result.guests.success++;
        } catch (error) {
          console.error(`Erreur migration invité ${guest.id}:`, error);
          result.guests.failed++;
        }
      }
    }

    // Migrer les check-ins
    const checkinsKey = `checkins_${eventId}`;
    const checkinsData = localStorage.getItem(checkinsKey);
    
    if (checkinsData) {
      const checkins = JSON.parse(checkinsData);
      for (const checkin of checkins) {
        try {
          const { error } = await supabase
            .from('checkins')
            .insert({
              guest_id: checkin.guest_id,
              event_id: eventId,
              checked_at: checkin.checked_at
            });

          if (error) throw error;
          result.checkins.success++;
        } catch (error) {
          console.error(`Erreur migration check-in ${checkin.guest_id}:`, error);
          result.checkins.failed++;
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Erreur migration globale:', error);
    throw error;
  }
}

/**
 * Migre tous les événements disponibles
 */
export async function migrateAllEvents(): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];
  
  // Récupérer tous les événements depuis localStorage
  const eventsKey = 'events';
  const eventsData = localStorage.getItem(eventsKey);
  
  if (eventsData) {
    const events = JSON.parse(eventsData);
    for (const event of events) {
      try {
        const result = await migrateEventToSupabase(event.id);
        results.push(result);
      } catch (error) {
        console.error(`Erreur migration événement ${event.id}:`, error);
      }
    }
  }

  return results;
}

/**
 * Vérifie si la migration est nécessaire
 */
export function needsMigration(eventId: string): boolean {
  const guestsKey = `guests_${eventId}`;
  const guestsData = localStorage.getItem(guestsKey);
  
  if (!guestsData) return false;
  
  const guests = JSON.parse(guestsData);
  return guests.length > 0;
}