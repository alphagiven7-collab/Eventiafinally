import { EventWithSettings } from '@/types';

type ShareSource = Partial<Pick<EventWithSettings, 'title' | 'cover_image' | 'heroImage' | 'hero_image' | 'bestPhotos' | 'branding' | 'metaDescription' | 'welcomeMessage' | 'description'>> | null | undefined;

/** Première photo publique https, jamais une image locale ni une donnée d’invité. */
export function publicCoverUrl(event: ShareSource): string {
  const candidates = [
    event?.branding?.ogShareImage,
    event?.cover_image,
    event?.heroImage,
    event?.hero_image,
    event?.branding?.heroImage,
    event?.branding?.welcomeImage,
    event?.bestPhotos?.[0],
  ];
  for (const value of candidates) {
    if (value && /^https:\/\//i.test(value)) return value;
  }
  return '';
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
