import { EventWithSettings } from '@/types';

const DEMO_KEY = 'invitia_live_demo';

export type DemoGuest = {
  id: string;
  name: string;
};

export type LiveDemo = {
  event: EventWithSettings;
  guests: DemoGuest[];
};

export function readLiveDemo(): LiveDemo | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(DEMO_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LiveDemo;
    if (!parsed?.event?.title) return null;
    return { event: parsed.event, guests: Array.isArray(parsed.guests) ? parsed.guests : [] };
  } catch {
    return null;
  }
}

export function writeLiveDemo(demo: LiveDemo): { error: string | null } {
  try {
    sessionStorage.setItem(DEMO_KEY, JSON.stringify(demo));
    return { error: null };
  } catch {
    return { error: 'La démo est trop lourde pour cet écran. Retirez quelques photos, puis réessayez.' };
  }
}
