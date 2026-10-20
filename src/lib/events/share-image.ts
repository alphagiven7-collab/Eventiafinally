import type { EventWithSettings } from '@/types';

type ShareSource = Partial<Pick<EventWithSettings, 'title' | 'cover_image' | 'heroImage' | 'hero_image' | 'bestPhotos' | 'branding' | 'metaDescription' | 'welcomeMessage' | 'description'>> | null | undefined;

function coverCandidates(event: ShareSource): string[] {
  return [
    event?.heroImage,
    event?.hero_image,
    event?.branding?.heroImage,
    event?.branding?.welcomeImage,
    event?.cover_image,
    event?.bestPhotos?.[0],
    event?.branding?.ogShareImage,
  ].filter((value): value is string => Boolean(value));
}

export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://eventiafinally.vercel.app').replace(/\/$/, '');
}

/** Photo de couverture publique. Une photo locale est servie par /e/[slug]/cover. */
export function publicCoverUrl(event: ShareSource, slug?: string): string {
  for (const value of coverCandidates(event)) {
    if (/^https:\/\//i.test(value)) return value;
    if (slug && value.startsWith('data:image/')) return `/e/${slug}/cover`;
  }
  return '';
}

export function firstCoverSource(event: ShareSource): string {
  return coverCandidates(event).find((value) => /^https:\/\//i.test(value) || value.startsWith('data:image/')) || '';
}

export function shareTitle(event: ShareSource): string {
  const title = event?.title?.trim() || 'Invitation';
  return `${title} | Eventia`;
}

export function shareDescription(event: ShareSource): string {
  const text = event?.metaDescription || event?.welcomeMessage || event?.description || '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean) return clean.slice(0, 180);
  const name = event?.title?.trim() || 'cet événement';
  return `Découvrez l’invitation de ${name} sur Eventia.`;
}
