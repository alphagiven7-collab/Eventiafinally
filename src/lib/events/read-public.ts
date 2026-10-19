import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/server';
import { EventWithSettings } from '@/types';
import { fetchInvitationMeta } from '@/lib/events/store';
import { getEventBySlug } from '@/data/events';

/** Métadonnées publiques de partage. Aucun nom d’invité ni numéro de table. */
export async function readPublicInvitation(slug: string): Promise<Pick<EventWithSettings, 'title' | 'metaDescription' | 'welcomeMessage' | 'bestPhotos' | 'cover_image' | 'branding' | 'description'> | null> {
  if (isSupabaseReady()) {
    try {
      const { supabase } = await createClient();
      const hosted = await fetchInvitationMeta(supabase, slug);
      if (hosted) {
        return {
          title: hosted.title,
          metaDescription: hosted.description || undefined,
          description: hosted.description || undefined,
          cover_image: hosted.coverUrl || undefined,
          branding: hosted.coverUrl
            ? {
                primaryColor: '#5b21b6',
                accentColor: '#2563eb',
                welcomeImage: hosted.coverUrl,
                heroImage: hosted.coverUrl,
                ogShareImage: hosted.coverUrl,
              }
            : undefined,
        };
      }
    } catch {
      // Les métadonnées tombent sur l'exemple statique.
    }
  }
  return getEventBySlug(slug);
}
