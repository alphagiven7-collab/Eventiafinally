import localforage from 'localforage';
import { EventWithSettings } from '@/types';

const draftStore = localforage.createInstance({
  name: 'eventia',
  storeName: 'creation-draft',
});

const DRAFT_KEY = 'current';

export type CreationDraft = {
  slug: string;
  event: EventWithSettings;
  savedAt: string;
};

export async function readCreationDraft(): Promise<CreationDraft | null> {
  try {
    return await draftStore.getItem<CreationDraft>(DRAFT_KEY);
  } catch {
    return null;
  }
}

export async function writeCreationDraft(draft: CreationDraft): Promise<void> {
  await draftStore.setItem(DRAFT_KEY, draft);
}

export async function clearCreationDraft(): Promise<void> {
  try {
    await draftStore.removeItem(DRAFT_KEY);
  } catch {
    /* le brouillon reste local si le stockage refuse */
  }
}

export function newDraftSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${base || 'invitation'}-${Date.now().toString(36).slice(-4)}`;
}
