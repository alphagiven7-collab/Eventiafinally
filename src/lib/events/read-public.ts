import { isSupabaseReady } from '@/config/supabase';
import { createPublicClient } from '@/lib/supabase/public';
import { EventWithSettings } from '@/types';
import { fetchInvitationMeta } from '@/lib/events/store';
import { getEventBySlug } from '@/data/events';

/** Métadonnées publiques de partage. Aucun nom d’invité ni numéro de table. */
export async function readPublicInvitation(slug: string): Promise<Pick<EventWithSettings, 'title' | 'metaDescription' | 'welcomeMessage' | 'bestPhotos' | 'cover_image' | 'branding' | 'description' | 'updated_at'> | null> {
  if (isSupabaseReady()) {
    try {
      const supabase = createPublicClient();
      const hosted = supabase ? await fetchInvitationMeta(supabase, slug) : null;
      if (hosted) {
        return {
          title: hosted.title,
          metaDescription: hosted.description || undefined,
          description: hosted.description || undefined,
          cover_image: hosted.coverUrl || undefined,
          updated_at: hosted.updatedAt || '',
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
