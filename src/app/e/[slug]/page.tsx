import { EventWithSettings } from '@/types';
import { fetchInvitationBySlug } from '@/lib/events/store';
import { createPublicClient } from '@/lib/supabase/public';
import InvitationView from './invitation-view';

export const revalidate = 60;

function firstPaintEvent(event: EventWithSettings): EventWithSettings {
  const heroImage =
    event.heroImage ||
    event.hero_image ||
    event.branding?.heroImage ||
    event.cover_image ||
    event.bestPhotos?.[0] ||
    '';

  return {
    ...event,
    heroImage,
    hero_image: undefined,
    cover_image: undefined,
    welcomeImage: undefined,
    welcome_image: undefined,
    bestPhotos: undefined,
    dressImages: undefined,
    groomMotifImage: undefined,
    brideMotifImage: undefined,
    aboutImage: undefined,
    mapImage: undefined,
    venueDetails: event.venueDetails
      ? { ...event.venueDetails, mapImage: '' }
      : event.venueDetails,
    branding: event.branding
      ? {
          ...event.branding,
          heroImage: '',
          welcomeImage: '',
          ogShareImage: '',
        }
      : event.branding,
  };
}

export default async function EventInvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let initialEvent: EventWithSettings | null = null;
  let initialMediaDeferred = false;
  const supabase = createPublicClient();
  if (supabase) {
    try {
      const hosted = await fetchInvitationBySlug(supabase, slug, { includeMusic: false });
      if (hosted) {
        delete hosted.adminCode;
        delete hosted.user_id;
        initialEvent = firstPaintEvent(hosted);
        initialMediaDeferred = true;
      }
    } catch {
      initialEvent = null;
    }
  }

  return (
    <InvitationView
      slug={slug}
      initialEvent={initialEvent}
      initialMediaDeferred={initialMediaDeferred}
    />
  );
}
