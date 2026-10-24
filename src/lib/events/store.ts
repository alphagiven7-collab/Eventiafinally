import { SupabaseClient } from '@supabase/supabase-js';
import { EventType, EventWithSettings } from '@/types';

type SettingsRow = {
  payload?: Partial<EventWithSettings> | null;
  welcome_message?: string | null;
  gate_hint?: string | null;
  invite_intro?: string | null;
  invite_secondary?: string | null;
  reserve_text?: string | null;
  rsvp_deadline_text?: string | null;
  rsvp_button_color?: string | null;
  meta_description?: string | null;
  about_title?: string | null;
  main_text?: string | null;
  program_section_title?: string | null;
  program?: EventWithSettings['program'];
  practical_section_title?: string | null;
  practical_info?: EventWithSettings['practicalInfo'];
  dress_code_title?: string | null;
  ambiance?: EventWithSettings['ambiance'];
  branding?: EventWithSettings['branding'];
  sections?: EventWithSettings['sections'];
  links?: EventWithSettings['links'];
};

export type EventRow = {
  id: string;
  user_id?: string | null;
  slug: string;
  title: string;
  subtitle?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  location?: string | null;
  address?: string | null;
  description?: string | null;
  cover_image?: string | null;
  is_published?: boolean | null;
  is_blocked?: boolean | null;
  locale?: string | null;
  timezone?: string | null;
  admin_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  guest_limit?: number | null;
  event_settings?: SettingsRow | SettingsRow[] | null;
};

type DbClient = SupabaseClient;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_PAYLOAD_CHARS = 14_000_000;

export function isUuid(value: string | undefined): boolean {
  return Boolean(value && UUID_RE.test(value));
}

export function explainWriteError(message: string): string {
  if (/payload|schema cache|column/i.test(message)) {
    return 'Service momentanément indisponible. Réessayez plus tard.';
  }
  return message;
}

function settingsOf(row: EventRow): SettingsRow | null {
  const raw = row.event_settings;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}

function httpUrl(value: string | undefined | null): string | null {
  if (!value || !value.startsWith('http')) return null;
  return value;
}

const MAX_STORED_COVER = 220_000;

function storedCover(value: string | undefined | null): string | null {
  if (!value) return null;
  if (/^https:\/\//i.test(value)) return value;
  if (value.startsWith('data:image/jpeg') && value.length <= MAX_STORED_COVER) return value;
  return null;
}

function samePhoto(hero: string, value: string | undefined): boolean {
  return Boolean(hero) && value === hero;
}

function slimInvitation(event: EventWithSettings): EventWithSettings {
  const hero = event.heroImage || '';
  const branding = event.branding
    ? {
        ...event.branding,
        heroImage: samePhoto(hero, event.branding.heroImage) ? '' : event.branding.heroImage,
        welcomeImage: samePhoto(hero, event.branding.welcomeImage) ? '' : event.branding.welcomeImage,
        ogShareImage: samePhoto(hero, event.branding.ogShareImage) ? '' : event.branding.ogShareImage,
      }
    : event.branding;
  return {
    ...event,
    hero_image: samePhoto(hero, event.hero_image) ? undefined : event.hero_image,
    cover_image: samePhoto(hero, event.cover_image) ? '' : event.cover_image,
    welcomeImage: samePhoto(hero, event.welcomeImage) ? undefined : event.welcomeImage,
    welcome_image: samePhoto(hero, event.welcome_image) ? undefined : event.welcome_image,
    branding,
  };
}

function withoutInlineMusic(event: EventWithSettings): EventWithSettings {
  const musicUrl = event.ambiance?.musicUrl || '';
  if (!musicUrl.startsWith('data:')) return event;
  return {
    ...event,
    ambiance: {
      enabled: Boolean(event.ambiance?.enabled),
      volume: event.ambiance?.volume ?? 0.35,
      musicUrl: '',
      hasFile: true,
    },
  };
}

function mergeAmbiance(
  stored: EventWithSettings['ambiance'] | null | undefined,
  local: EventWithSettings['ambiance'] | undefined,
): EventWithSettings['ambiance'] | undefined {
  if (!stored) return local;
  if (!local) return stored;
  const cleared = local.hasFile === false && !local.musicUrl;
  const keepStoredFile = !cleared && !local.musicUrl && Boolean(local.hasFile || stored.musicUrl);
  return {
    enabled: local.enabled ?? stored.enabled ?? false,
    volume: typeof local.volume === 'number' ? local.volume : stored.volume,
    musicUrl: cleared ? '' : local.musicUrl || (keepStoredFile ? stored.musicUrl || '' : ''),
    hasFile: cleared ? false : Boolean(local.musicUrl || keepStoredFile),
  };
}

export function fromDatabase(row: EventRow): EventWithSettings {
  const settings = settingsOf(row);
  const payload = settings?.payload ?? {};

  return {
    view_count: payload.view_count ?? 0,
    ...payload,
    id: row.id,
    user_id: row.user_id ?? payload.user_id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? payload.subtitle,
    type: (row.event_type as EventType) || payload.type || 'wedding',
    event_date: row.event_date || payload.event_date || new Date().toISOString(),
    event_time: row.event_time ?? payload.event_time,
    location: row.location || payload.location || '',
    address: row.address ?? payload.address,
    description: row.description ?? payload.description,
    cover_image: payload.cover_image || row.cover_image || '',
    is_published: Boolean(row.is_published),
    isBlocked: Boolean(row.is_blocked),
    adminCode: row.admin_code ?? payload.adminCode,
    welcomeMessage: settings?.welcome_message ?? payload.welcomeMessage,
    gateHint: settings?.gate_hint ?? payload.gateHint,
    inviteIntro: settings?.invite_intro ?? payload.inviteIntro,
    inviteSecondary: settings?.invite_secondary ?? payload.inviteSecondary,
    reserveText: settings?.reserve_text ?? payload.reserveText,
    rsvpDeadlineText: settings?.rsvp_deadline_text ?? payload.rsvpDeadlineText,
    rsvpButtonColor: settings?.rsvp_button_color ?? payload.rsvpButtonColor,
    qrDisplayMode: (payload.qrDisplayMode as 'immediate' | 'after-confirmation') || 'after-confirmation',
    metaDescription: settings?.meta_description ?? payload.metaDescription,
    aboutTitle: settings?.about_title ?? payload.aboutTitle,
    mainText: settings?.main_text ?? payload.mainText,
    programSectionTitle: settings?.program_section_title ?? payload.programSectionTitle,
    program: settings?.program ?? payload.program,
    practicalSectionTitle: settings?.practical_section_title ?? payload.practicalSectionTitle,
    practicalInfo: settings?.practical_info ?? payload.practicalInfo,
    dressCodeTitle: settings?.dress_code_title ?? payload.dressCodeTitle,
    ambiance: mergeAmbiance(settings?.ambiance, payload.ambiance),
    branding: settings?.branding ?? payload.branding,
    sections: settings?.sections ?? payload.sections,
    links: settings?.links ?? payload.links,
    created_at: row.created_at || payload.created_at || new Date().toISOString(),
    updated_at: row.updated_at || payload.updated_at || new Date().toISOString(),
    guestLimit: row.guest_limit != null ? row.guest_limit : (payload.guestLimit ?? 3),
  };
}

export async function fetchInvitationStamp(
  supabase: DbClient,
  slug: string,
): Promise<{ updated_at: string; is_published: boolean; is_blocked: boolean } | null> {
  const { data, error } = await supabase
    .from('events')
    .select('updated_at, is_published, is_blocked')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  return {
    updated_at: data.updated_at || '',
    is_published: Boolean(data.is_published),
    is_blocked: Boolean(data.is_blocked),
  };
}

export async function fetchInvitationShell(
  supabase: DbClient,
  slug: string,
): Promise<EventWithSettings | null> {
  const { data, error } = await supabase
    .from('events')
    .select('id, user_id, slug, title, subtitle, event_type, event_date, event_time, location, address, description, cover_image, is_published, is_blocked, created_at, updated_at')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  const event = fromDatabase(data as EventRow);
  if (!event.heroImage && /^https:\/\//i.test(event.cover_image || '')) {
    event.heroImage = event.cover_image;
  }
  return event;
}

export async function fetchInvitationBySlug(
  supabase: DbClient,
  slug: string,
  options?: { includeMusic?: boolean },
): Promise<EventWithSettings | null> {
  const settings = options?.includeMusic === false ? 'event_settings(payload)' : 'event_settings(*)';
  const { data, error } = await supabase
    .from('events')
    .select(`*, ${settings}`)
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;
  const event = fromDatabase(data as EventRow);
  if (options?.includeMusic === false && event.ambiance?.musicUrl?.startsWith('data:')) {
    event.ambiance = { ...event.ambiance, musicUrl: '', hasFile: true };
  }
  return event;
}

export async function fetchEventMusic(supabase: DbClient, eventId: string): Promise<string | null> {
  if (!isUuid(eventId)) return null;
  const { data, error } = await supabase
    .from('event_settings')
    .select('ambiance')
    .eq('event_id', eventId)
    .maybeSingle();
  if (error || !data) return null;
  const url = (data.ambiance as { musicUrl?: string } | null)?.musicUrl;
  return url || null;
}

export async function fetchGuestLimitBySlug(supabase: DbClient, slug: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('events')
    .select('guest_limit')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  return data.guest_limit != null ? Number(data.guest_limit) : null;
}

export async function fetchInvitationMeta(
  supabase: DbClient,
  slug: string,
): Promise<{ title: string; description: string; coverUrl: string; updatedAt: string } | null> {
  const { data, error } = await supabase
    .from('events')
    .select('title, description, cover_image, updated_at, event_settings(meta_description)')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  const settings = Array.isArray(data.event_settings) ? data.event_settings[0] : data.event_settings;
  const cover = typeof data.cover_image === 'string' ? data.cover_image : '';
  return {
    title: data.title,
    description: settings?.meta_description || data.description || '',
    coverUrl: /^https:\/\//i.test(cover) ? cover : '',
    updatedAt: data.updated_at || '',
  };
}

const SHARE_PHOTO_KEYS = ['hero', 'hero_snake', 'welcome_top', 'cover', 'brand_hero', 'welcome', 'photo', 'og'] as const;

function firstSharePhoto(row: Record<string, unknown> | null): string {
  if (!row) return '';
  for (const key of SHARE_PHOTO_KEYS) {
    const value = row[key];
    if (typeof value === 'string' && (/^https:\/\//i.test(value) || value.startsWith('data:image/'))) return value;
  }
  return '';
}

async function photoFromPayload(supabase: DbClient, eventId: string): Promise<string> {
  const { data, error } = await supabase
    .from('event_settings')
    .select('payload')
    .eq('event_id', eventId)
    .maybeSingle();
  if (error || !data?.payload || typeof data.payload !== 'object') return '';
  const payload = data.payload as Partial<EventWithSettings>;
  return [
    payload.heroImage,
    payload.hero_image,
    payload.welcomeImage,
    payload.cover_image,
    payload.branding?.heroImage,
    payload.branding?.welcomeImage,
    payload.bestPhotos?.[0],
    payload.branding?.ogShareImage,
  ].find((value) => typeof value === 'string' && (/^https:\/\//i.test(value) || value.startsWith('data:image/'))) || '';
}

/** Photo d’accueil seule, sans télécharger la galerie ni la musique. */
export async function fetchShareImageSource(supabase: DbClient, slug: string): Promise<string> {
  const { data: row, error } = await supabase
    .from('events')
    .select('id, cover_image')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !row) return '';
  const column = typeof row.cover_image === 'string' ? row.cover_image.trim() : '';
  if (/^https:\/\//i.test(column) || column.startsWith('data:image/')) return column;

  const top = await supabase
    .from('event_settings')
    .select('hero:payload->>heroImage, hero_snake:payload->>hero_image, welcome_top:payload->>welcomeImage, cover:payload->>cover_image')
    .eq('event_id', row.id)
    .maybeSingle();
  if (top.error) return photoFromPayload(supabase, row.id);
  const direct = firstSharePhoto(top.data as Record<string, unknown> | null);
  if (direct) return direct;

  const nested = await supabase
    .from('event_settings')
    .select('brand_hero:payload->branding->>heroImage, welcome:payload->branding->>welcomeImage, photo:payload->bestPhotos->>0, og:payload->branding->>ogShareImage')
    .eq('event_id', row.id)
    .maybeSingle();
  if (nested.error) return photoFromPayload(supabase, row.id);
  return firstSharePhoto(nested.data as Record<string, unknown> | null);
}

export async function listInvitations(supabase: DbClient, userId: string): Promise<EventWithSettings[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, user_id, slug, title, subtitle, event_type, event_date, event_time, location, address, is_published, is_blocked, guest_limit, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error && /is_blocked|guest_limit|column|schema cache/i.test(error.message)) {
    const fallback = await supabase
      .from('events')
      .select('id, user_id, slug, title, subtitle, event_type, event_date, event_time, location, address, is_published, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (fallback.error || !fallback.data) return [];
    return (fallback.data as EventRow[]).map(fromDatabase);
  }

  if (error || !data) return [];
  return (data as EventRow[]).map(fromDatabase);
}

export async function publishInvitation(
  supabase: DbClient,
  event: EventWithSettings,
  options?: { shareCover?: string },
): Promise<{ error: string | null; id: string }> {
  const musicLength = event.ambiance?.musicUrl?.length || 0;
  if (musicLength > 7_000_000) {
    return {
      error: 'La musique est trop lourde. Importez un fichier de moins de 5 Mo.',
      id: event.id,
    };
  }
  const payloadEvent = withoutInlineMusic(slimInvitation(event));
  if (JSON.stringify(payloadEvent).length > MAX_PAYLOAD_CHARS) {
    return {
      error: 'Les photos sont trop lourdes pour être publiées. Réduisez la galerie, puis réessayez.',
      id: event.id,
    };
  }

  let id = isUuid(event.id) ? event.id : '';
  if (!id) {
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('slug', event.slug)
      .maybeSingle();
    id = existing?.id || crypto.randomUUID();
  }
  const now = new Date().toISOString();
  const storedPayload: EventWithSettings = { ...payloadEvent, id, updated_at: now };
  const ambianceToStore = event.ambiance ?? { enabled: false, musicUrl: '', volume: 0.35, hasFile: false };
  const preserveMusic = Boolean(ambianceToStore.hasFile) && !ambianceToStore.musicUrl;
  const nextCover = storedCover(options?.shareCover) || httpUrl(event.cover_image);
  const hasPhoto = Boolean(
    event.heroImage ||
    event.hero_image ||
    event.cover_image ||
    event.branding?.heroImage ||
    event.branding?.ogShareImage ||
    event.branding?.welcomeImage ||
    event.bestPhotos?.[0],
  );

  const eventRow: Record<string, unknown> = {
    id,
    user_id: event.user_id,
    slug: event.slug,
    title: event.title,
    subtitle: event.subtitle ?? null,
    event_type: event.type,
    event_date: event.event_date,
    event_time: event.event_time ?? null,
    location: event.location,
    address: event.address ?? null,
    description: event.description ?? null,
    is_published: event.is_published,
    locale: 'fr',
    timezone: 'UTC',
    admin_code: event.adminCode ?? null,
    updated_at: now,
  };
  if (nextCover) eventRow.cover_image = nextCover;
  else if (event.coverPhotoCleared || !hasPhoto) eventRow.cover_image = null;

  const eventError = await updateOrInsert(supabase, 'events', eventRow, 'id');
  if (eventError) return { error: explainWriteError(eventError), id };

  if (typeof event.guestLimit === 'number') {
    await supabase.from('events').update({ guest_limit: event.guestLimit }).eq('id', id);
  }

  const settingsRow: Record<string, unknown> = {
    event_id: id,
    welcome_message: event.welcomeMessage ?? null,
    gate_hint: event.gateHint ?? null,
    invite_intro: event.inviteIntro ?? null,
    invite_secondary: event.inviteSecondary ?? null,
    reserve_text: event.reserveText ?? null,
    rsvp_deadline_text: event.rsvpDeadlineText ?? null,
    rsvp_button_color: event.rsvpButtonColor ?? null,
    meta_description: event.metaDescription ?? null,
    about_title: event.aboutTitle ?? null,
    main_text: event.mainText ?? null,
    program_section_title: event.programSectionTitle ?? null,
    program: event.program ?? [],
    practical_section_title: event.practicalSectionTitle ?? null,
    practical_info: event.practicalInfo ?? [],
    dress_code_title: event.dressCodeTitle ?? null,
    branding: storedPayload.branding ?? {},
    sections: event.sections ?? {},
    links: event.links ?? {},
    payload: storedPayload,
    updated_at: now,
  };
  if (!preserveMusic) settingsRow.ambiance = ambianceToStore;

  const settingsError = await updateOrInsert(supabase, 'event_settings', settingsRow, 'event_id');
  if (settingsError) return { error: explainWriteError(settingsError), id };
  return { error: null, id };
}

async function updateOrInsert(
  supabase: DbClient,
  table: 'events' | 'event_settings',
  row: Record<string, unknown>,
  key: 'id' | 'event_id',
): Promise<string | null> {
  const { data, error } = await supabase.from(table).update(row).eq(key, row[key]).select(key);
  if (error) return error.message;
  if (data && data.length > 0) return null;
  const inserted = await supabase.from(table).insert(row);
  return inserted.error ? inserted.error.message : null;
}

export async function ownedEventCount(supabase: DbClient, userId: string): Promise<number | null> {
  const { count, error } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) return null;
  return count ?? 0;
}

export async function deleteInvitation(supabase: DbClient, eventId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  return { error: error ? explainWriteError(error.message) : null };
}

export type GalleryItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  event_date: string | null;
  location: string | null;
  cover_image: string | null;
};

// Le choix de la galerie est rangé dans les réglages déjà enregistrés de l'invitation : aucune colonne à ajouter.
export async function listGalleryInvitations(supabase: DbClient): Promise<GalleryItem[]> {
  const { data, error } = await supabase
    .from('event_settings')
    .select('event_id, events!inner(id, slug, title, subtitle, event_date, location, cover_image, is_published, updated_at)')
    .eq('payload->>showInGallery', 'true')
    .eq('events.is_published', true)
    .limit(60);
  if (error || !data) return [];
  type Row = { events: (GalleryItem & { updated_at?: string }) | (GalleryItem & { updated_at?: string })[] | null };
  return (data as unknown as Row[])
    .map((row) => (Array.isArray(row.events) ? row.events[0] : row.events))
    .filter((item): item is GalleryItem & { updated_at?: string } => Boolean(item?.slug))
    .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
    .map(({ id, slug, title, subtitle, event_date, location, cover_image }) => ({ id, slug, title, subtitle, event_date, location, cover_image }));
}

export async function fetchGalleryFlagsForEvents(
  supabase: DbClient,
  eventIds: string[],
): Promise<Record<string, boolean>> {
  if (eventIds.length === 0) return {};
  const { data, error } = await supabase
    .from('event_settings')
    .select('event_id, flag:payload->>showInGallery')
    .in('event_id', eventIds);
  if (error || !data) return {};
  return Object.fromEntries((data as unknown as { event_id: string; flag: string | null }[]).map((row) => [row.event_id, row.flag === 'true']));
}

export async function fetchGalleryFlags(
  supabase: DbClient,
  userId: string,
): Promise<Record<string, boolean>> {
  const { data, error } = await supabase.from('events').select('id').eq('user_id', userId);
  if (error || !data) return {};
  return fetchGalleryFlagsForEvents(supabase, (data as { id: string }[]).map((row) => row.id));
}

export async function setGalleryVisibility(
  supabase: DbClient,
  eventId: string,
  visible: boolean,
): Promise<{ error: string | null }> {
  const { data, error } = await supabase.from('event_settings').select('payload').eq('event_id', eventId).maybeSingle();
  if (error) return { error: 'Le choix n’a pas pu être enregistré. Réessayez.' };
  if (!data) return { error: 'Enregistrez d’abord l’invitation depuis la personnalisation.' };
  const payload = { ...((data as { payload?: Record<string, unknown> | null }).payload ?? {}), showInGallery: visible };
  const { data: updated, error: updateError } = await supabase
    .from('event_settings')
    .update({ payload })
    .eq('event_id', eventId)
    .select('event_id');
  if (updateError || !updated?.length) return { error: 'Le choix n’a pas pu être enregistré. Réessayez.' };
  return { error: null };
}
