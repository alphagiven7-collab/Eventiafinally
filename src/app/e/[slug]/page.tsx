import { EventWithSettings } from '@/types';
import { fetchInvitationBySlug, fetchInvitationShell } from '@/lib/events/store';
import { createPublicClient } from '@/lib/supabase/public';
import InvitationView from './invitation-view';

export const revalidate = 60;

function safeHero(value: string, slug: string): string {
  if (/^https:\/\//i.test(value)) return value;
  if (value.startsWith('data:image/')) return `/e/${slug}/cover`;
  return '';
}

function firstPaintEvent(event: EventWithSettings, slug: string): EventWithSettings {
  const rawHero =
    event.heroImage ||
    event.hero_image ||
    event.branding?.heroImage ||
    event.cover_image ||
    event.bestPhotos?.[0] ||
    '';
  const heroImage = safeHero(rawHero, slug);

  return {
    ...event,
    heroImage,
    hero_image: undefined,
    cover_image: heroImage.startsWith('http') ? heroImage : undefined,
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
          heroImage: heroImage,
          welcomeImage: '',
          ogShareImage: heroImage,
        }
      : event.branding,
    ambiance: event.ambiance
      ? { ...event.ambiance, musicUrl: event.ambiance.musicUrl?.startsWith('data:') ? '' : event.ambiance.musicUrl }
      : event.ambiance,
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
        initialEvent = firstPaintEvent(hosted, slug);
        initialMediaDeferred = true;
      }
    } catch {
      initialEvent = null;
    }
    if (!initialEvent) {
      try {
        const shell = await fetchInvitationShell(supabase, slug);
        if (shell) {
          delete shell.adminCode;
          delete shell.user_id;
          initialEvent = shell;
          initialMediaDeferred = true;
        }
      } catch {
        initialEvent = null;
      }
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
