import type { EventWithSettings } from '@/types';

/** An explicitly empty cover stays empty; older invitations retain their fallback. */
export function coverPhotoOf(event: EventWithSettings): string {
  if (event.coverPhotoCleared) return '';
  return event.heroImage || event.hero_image || event.branding?.heroImage || event.cover_image || event.bestPhotos?.[0] || '';
}

export function coverPositionOf(position?: { x?: number; y?: number }) {
  const clamp = (value?: number) => typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(100, value)) : 50;
  return { x: clamp(position?.x), y: clamp(position?.y) };
}

export function coverPositionCss(position?: { x?: number; y?: number }): string {
  const { x, y } = coverPositionOf(position);
  return `${x}% ${y}%`;
}
