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
  locale?: string | null;
  timezone?: string | null;
  admin_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  event_settings?: SettingsRow | SettingsRow[] | null;
};

type DbClient = SupabaseClient;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_PAYLOAD_CHARS = 4_000_000;

export function isUuid(value: string | undefined): boolean {
  return Boolean(value && UUID_RE.test(value));
}

export function explainWriteError(message: string): string {
  if (/payload|schema cache|column/i.test(message)) {
    return 'La base doit être mise à jour. Exécutez supabase/migrations/006_hosted_invitation.sql dans le SQL Editor de Supabase.';
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
    adminCode: row.admin_code ?? payload.adminCode,
    welcomeMessage: settings?.welcome_message ?? payload.welcomeMessage,
    gateHint: settings?.gate_hint ?? payload.gateHint,
    inviteIntro: settings?.invite_intro ?? payload.inviteIntro,
    inviteSecondary: settings?.invite_secondary ?? payload.inviteSecondary,
    reserveText: settings?.reserve_text ?? payload.reserveText,
    rsvpDeadlineText: settings?.rsvp_deadline_text ?? payload.rsvpDeadlineText,
    rsvpButtonColor: settings?.rsvp_button_color ?? payload.rsvpButtonColor,
    metaDescription: settings?.meta_description ?? payload.metaDescription,
    aboutTitle: settings?.about_title ?? payload.aboutTitle,
    mainText: settings?.main_text ?? payload.mainText,
    programSectionTitle: settings?.program_section_title ?? payload.programSectionTitle,
    program: settings?.program ?? payload.program,
    practicalSectionTitle: settings?.practical_section_title ?? payload.practicalSectionTitle,
    practicalInfo: settings?.practical_info ?? payload.practicalInfo,
    dressCodeTitle: settings?.dress_code_title ?? payload.dressCodeTitle,
    ambiance: settings?.ambiance ?? payload.ambiance,
    branding: settings?.branding ?? payload.branding,
    sections: settings?.sections ?? payload.sections,
    links: settings?.links ?? payload.links,
    created_at: row.created_at || payload.created_at || new Date().toISOString(),
    updated_at: row.updated_at || payload.updated_at || new Date().toISOString(),
  };
}

export async function fetchInvitationBySlug(supabase: DbClient, slug: string): Promise<EventWithSettings | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*, event_settings(*)')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;
  return fromDatabase(data as EventRow);
}

export async function listInvitations(supabase: DbClient, userId: string): Promise<EventWithSettings[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*, event_settings(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as EventRow[]).map(fromDatabase);
}

export async function publishInvitation(
  supabase: DbClient,
  event: EventWithSettings,
): Promise<{ error: string | null; id: string }> {
  const serialized = JSON.stringify(event);
  if (serialized.length > MAX_PAYLOAD_CHARS) {
    const heavyMusic = (event.ambiance?.musicUrl?.length || 0) > 1_600_000;
    return {
      error: heavyMusic
        ? 'La musique est trop lourde. Importez un extrait MP3 de moins de 1,2 Mo.'
        : 'Les photos sont trop lourdes pour être publiées. Réduisez la galerie, puis réessayez.',
      id: event.id,
    };
  }

  const { data: existing } = await supabase
    .from('events')
    .select('id')
    .eq('slug', event.slug)
    .maybeSingle();

  const id = existing?.id || (isUuid(event.id) ? event.id : crypto.randomUUID());
  const now = new Date().toISOString();
  const stored: EventWithSettings = { ...event, id, updated_at: now };

  const { error: eventError } = await supabase.from('events').upsert({
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
    cover_image: httpUrl(event.cover_image),
    is_published: event.is_published,
    locale: 'fr',
    timezone: 'UTC',
    admin_code: event.adminCode ?? null,
    updated_at: now,
  }, { onConflict: 'id' });

  if (eventError) return { error: explainWriteError(eventError.message), id };

  await supabase.from('events').update({ guest_limit: event.guestLimit ?? 3 }).eq('id', id);

  const { error: settingsError } = await supabase.from('event_settings').upsert({
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
    ambiance: event.ambiance ?? { enabled: false, musicUrl: '', volume: 0.35 },
    branding: event.branding ?? {},
    sections: event.sections ?? {},
    links: event.links ?? {},
    payload: stored,
    updated_at: now,
  }, { onConflict: 'event_id' });

  if (settingsError) return { error: explainWriteError(settingsError.message), id };
  return { error: null, id };
}

export async function deleteInvitation(supabase: DbClient, eventId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  return { error: error ? explainWriteError(error.message) : null };
}
