import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/server';
import { EventWithSettings } from '@/types';
import { fetchInvitationMeta } from '@/lib/events/store';
import { getEventBySlug } from '@/data/events';

/** Titre et description seulement : les photos et la musique restent pour la page. */
export async function readPublicInvitation(slug: string): Promise<Pick<EventWithSettings, 'title' | 'metaDescription' | 'welcomeMessage' | 'bestPhotos' | 'cover_image' | 'branding'> | null> {
  if (isSupabaseReady()) {
    try {
      const { supabase } = await createClient();
      const hosted = await fetchInvitationMeta(supabase, slug);
      if (hosted) return { title: hosted.title, metaDescription: hosted.description || undefined };
    } catch {
      // Les métadonnées tombent sur l'exemple statique.
    }
  }
  return getEventBySlug(slug);
}
