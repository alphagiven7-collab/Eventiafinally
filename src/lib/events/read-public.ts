import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/server';
import { EventWithSettings } from '@/types';
import { fetchInvitationBySlug } from '@/lib/events/store';
import { getEventBySlug } from '@/data/events';

/** Lecture publique : la ligne publiée gagne sur l'exemple statique. */
export async function readPublicInvitation(slug: string): Promise<EventWithSettings | null> {
  if (isSupabaseReady()) {
    try {
      const { supabase } = await createClient();
      const hosted = await fetchInvitationBySlug(supabase, slug);
      if (hosted) return hosted;
    } catch {
      // La page cliente réessaie. Les métadonnées tombent sur l'exemple statique.
    }
  }
  return getEventBySlug(slug);
}
