import localforage from 'localforage';
import { EventWithSettings } from '@/types';

const offlineStore = localforage.createInstance({
  name: 'eventia',
  storeName: 'offline-invitations',
});

const SHELL_CACHE = 'eventia-v2-shell';

export type OfflineInvitation = {
  key: string;
  slug: string;
  token: string;
  guestName?: string;
  guestTable?: string;
  event: EventWithSettings;
  savedAt: string;
  updatedAt: string;
  viewHtml?: string;
  viewCss?: string;
};

export function offlineKey(slug: string, token?: string): string {
  return token ? `${slug}::${token}` : slug;
}

export async function readOfflineInvitation(slug: string, token?: string): Promise<OfflineInvitation | null> {
  try {
    return await offlineStore.getItem<OfflineInvitation>(offlineKey(slug, token));
  } catch {
    return null;
  }
}

function publicEvent(event: EventWithSettings): EventWithSettings {
  const copy = { ...event };
  delete copy.adminCode;
  delete copy.user_id;
  if (copy.ambiance?.musicUrl?.startsWith('data:')) {
    copy.ambiance = { ...copy.ambiance, musicUrl: '', hasFile: false };
  }
  return copy;
}

async function shrinkToDataUrl(source: string): Promise<string> {
  if (!source || source.startsWith('data:') || !source.startsWith('http')) return source;
  try {
    const response = await fetch(source, { mode: 'cors' });
    if (!response.ok) return source;
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) return source;
    const bitmap = await createImageBitmap(blob);
    const maxEdge = 1400;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) return source;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return source;
  }
}

async function inlineList(values: string[] | undefined): Promise<string[] | undefined> {
  if (!values?.length) return values;
  const next: string[] = [];
  for (const value of values.slice(0, 8)) {
    next.push(await shrinkToDataUrl(value));
  }
  return next;
}

export async function saveOfflineInvitation(input: {
  event: EventWithSettings;
  token?: string;
  guestName?: string;
  guestTable?: string;
}): Promise<OfflineInvitation> {
  const event = publicEvent(input.event);
  const cover = await shrinkToDataUrl(event.cover_image || event.heroImage || event.branding?.heroImage || '');
  event.cover_image = cover || event.cover_image;
  event.heroImage = cover || event.heroImage;
  event.hero_image = cover || event.hero_image;
  if (event.branding) {
    event.branding = {
      ...event.branding,
      heroImage: cover || event.branding.heroImage,
      welcomeImage: cover || event.branding.welcomeImage,
      ogShareImage: cover || event.branding.ogShareImage,
    };
  }
  event.bestPhotos = await inlineList(event.bestPhotos);
  event.dressImages = await inlineList(event.dressImages);
  if (event.aboutImage) event.aboutImage = await shrinkToDataUrl(event.aboutImage);
  if (event.groomMotifImage) event.groomMotifImage = await shrinkToDataUrl(event.groomMotifImage);
  if (event.brideMotifImage) event.brideMotifImage = await shrinkToDataUrl(event.brideMotifImage);
  const saved: OfflineInvitation = {
    key: offlineKey(event.slug, input.token),
    slug: event.slug,
    token: input.token || '',
    guestName: input.guestName?.trim() || undefined,
    guestTable: input.guestTable?.trim() || undefined,
    event,
    savedAt: new Date().toISOString(),
    updatedAt: event.updated_at || new Date().toISOString(),
  };
  await offlineStore.setItem(saved.key, saved);
  await cacheInvitationShell();
  return saved;
}

export async function storeOfflineView(
  key: string,
  view: { css: string; html: string; secrets?: string[] },
): Promise<void> {
  const current = await offlineStore.getItem<OfflineInvitation>(key);
  if (!current) throw new Error('Invitation hors ligne introuvable.');
  let html = view.html;
  for (const secret of view.secrets || []) {
    if (secret && secret.length > 2) html = html.split(secret).join('');
  }
  await offlineStore.setItem(key, {
    ...current,
    viewCss: view.css,
    viewHtml: html,
  });
}

async function ensureWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  if (navigator.serviceWorker.controller) return;
  await new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, 5000);
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

export async function cacheInvitationShell(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  await ensureWorker();
  const cache = await caches.open(SHELL_CACHE);
  const shell = await fetch('/invitation-offline.html', { cache: 'reload' });
  if (!shell.ok) throw new Error('La page hors ligne est indisponible.');
  await cache.put('/invitation-offline.html', new Response(await shell.arrayBuffer(), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  }));
  if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
    throw new Error('Le service worker n’est pas encore actif.');
  }
}
