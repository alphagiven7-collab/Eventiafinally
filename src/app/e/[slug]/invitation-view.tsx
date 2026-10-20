'use client';

import { useState, useEffect } from 'react';
import InvitationExperience from '@/components/invitation/InvitationExperience';
import { getEventBySlug } from '@/data/events';
import { EventWithSettings, GuestStatus } from '@/types';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { fetchInvitationBySlug, fetchInvitationStamp } from '@/lib/events/store';
import { lookupGuestByToken, PublicGuest } from '@/lib/guests/store';
import { readOfflineInvitation } from '@/lib/invitation/offline';
import { Heart, Home } from 'lucide-react';

export default function InvitationView({
  slug,
  initialEvent,
  initialMediaDeferred = false,
}: {
  slug: string;
  initialEvent: EventWithSettings | null;
  initialMediaDeferred?: boolean;
}) {
  const [event, setEvent] = useState<EventWithSettings | null>(() => initialEvent || getEventBySlug(slug));
  const [loading, setLoading] = useState(() => initialMediaDeferred || !(initialEvent || getEventBySlug(slug)));
  const [resolvedGuest, setResolvedGuest] = useState<PublicGuest | null>(null);
  const [liveStatus, setLiveStatus] = useState<GuestStatus | null>(null);
  const [rsvpNotice, setRsvpNotice] = useState('');
  const [offlineGuest, setOfflineGuest] = useState<{ name?: string; table?: string; status?: GuestStatus } | null>(null);
  const [usingOffline, setUsingOffline] = useState(false);
  const [offlineNote, setOfflineNote] = useState('');
  const [linkGuestName, setLinkGuestName] = useState('');

  // Charger l'événement — LOCAL FIRST pour une expérience instantanée (Mobile First)
  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      const known = initialEvent || getEventBySlug(slug);
      if (known && !initialMediaDeferred) {
        setEvent(known);
        setLoading(false);
      } else if (!known) {
        setLoading(true);
      }
      const token = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') || '' : '';
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const saved = await readOfflineInvitation(slug, token);
        if (saved && !cancelled) {
          setEvent(saved.event);
          setUsingOffline(true);
          setOfflineGuest({ name: saved.guestName, table: saved.guestTable, status: saved.guestStatus });
          setOfflineNote('Invitation disponible hors ligne.');
          setLoading(false);
          return;
        }
        if (!cancelled) {
          setOfflineNote(known
            ? 'Connexion absente. Cette copie reste affichée.'
            : 'Cette invitation doit encore être enregistrée pendant que vous êtes en ligne.');
          if (!known) setEvent(null);
          setLoading(false);
          return;
        }
      }
      if (isSupabaseReady()) {
        try {
          if (known?.updated_at && !initialMediaDeferred) {
            const stamp = await fetchInvitationStamp(createClient(), slug);
            if (
              !cancelled &&
              stamp &&
              stamp.updated_at === known.updated_at &&
              stamp.is_published === Boolean(known.is_published) &&
              stamp.is_blocked === Boolean(known.isBlocked)
            ) {
              setLoading(false);
              return;
            }
          }
          if (cancelled) return;
          const hosted = await fetchInvitationBySlug(createClient(), slug, { includeMusic: false });
          if (hosted && !cancelled) {
            setEvent((current) => {
              if (initialMediaDeferred) return hosted;
              if (
                current &&
                current.id === hosted.id &&
                current.updated_at === hosted.updated_at &&
                current.is_published === hosted.is_published &&
                current.isBlocked === hosted.isBlocked
              ) {
                return current;
              }
              return hosted;
            });
            const saved = await readOfflineInvitation(slug, token);
            if (saved && saved.updatedAt && hosted.updated_at && saved.updatedAt !== hosted.updated_at) {
              setOfflineNote('Une version plus récente est en ligne. Enregistrez-la à nouveau pour le hors ligne.');
            } else if (saved) {
              setOfflineNote('Invitation disponible hors ligne.');
            }
            setLoading(false);
            return;
          }
        } catch {
          // L'exemple statique reste disponible si le serveur ne répond pas.
        }
      }

      const demo = known || getEventBySlug(slug);
      if (!cancelled) {
        setEvent(demo);
        const saved = await readOfflineInvitation(slug, token);
        if (saved && demo && saved.updatedAt && demo.updated_at && saved.updatedAt !== demo.updated_at) {
          setOfflineNote('Une version plus récente est en ligne. Enregistrez-la à nouveau pour le hors ligne.');
        } else if (saved) {
          setOfflineNote('Invitation disponible hors ligne.');
        }
        setLoading(false);
      }
    }

    loadEvent();

    return () => { cancelled = true; };
  }, [slug, initialEvent, initialMediaDeferred]);

  useEffect(() => {
    const name = new URLSearchParams(window.location.search).get('guest')?.trim() || '';
    if (name) setLinkGuestName(name);
  }, [slug]);

  // Le lien personnel est vérifié sur le serveur, pas dans ce navigateur.
  useEffect(() => {
    if (typeof window === 'undefined' || !isSupabaseReady()) return;
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) return;
    let cancelled = false;
    lookupGuestByToken(createClient(), token).then((guest) => {
      if (!cancelled) setResolvedGuest(guest);
    });
    return () => { cancelled = true; };
  }, [slug]);

  const matchedGuest = resolvedGuest && event && resolvedGuest.event_id === event.id
    ? resolvedGuest
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f6] dark:bg-[#0b0f19]">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (event?.isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f4f4f6] dark:bg-[#0b0f19]">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Invitation bloquée</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Cette invitation n’est plus accessible. L’admin peut la rendre à nouveau disponible.
          </p>
          <a href="/" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-bold text-white">
            Retour à Eventia
          </a>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f4f4f6] dark:bg-[#0b0f19]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-pink-50 dark:bg-pink-900/30 text-pink-500 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Invitation introuvable</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {offlineNote || `Désolé, l'invitation "${slug}" n'existe pas.`}
          </p>
          <a href="/" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-3 px-6 rounded-xl text-sm font-semibold transition">
            <Home className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </a>
        </div>
      </div>
    );
  }

  const shownStatus = liveStatus || matchedGuest?.status || (usingOffline ? offlineGuest?.status : undefined);

  return (
    <>
      {rsvpNotice && (
        <div className="fixed inset-x-3 bottom-4 z-[80] rounded-2xl bg-violet-700 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
          {rsvpNotice}
        </div>
      )}
      {offlineNote && (
        <div className="fixed inset-x-3 top-3 z-[70] rounded-2xl bg-slate-900 px-4 py-2 text-center text-xs font-semibold text-white shadow-lg">
          {offlineNote}
        </div>
      )}
      <InvitationExperience
        event={event}
        guestName={matchedGuest?.name || offlineGuest?.name || linkGuestName || undefined}
        guestToken={matchedGuest?.token}
        guestStatus={shownStatus}
        guestTable={matchedGuest?.table_number || offlineGuest?.table}
        onRsvp={(result) => {
          if (result.error) {
            setLiveStatus(null);
            setRsvpNotice(result.error);
            return;
          }
          setLiveStatus(result.status);
          setRsvpNotice(result.notice || (result.status === 'confirmed' ? 'C’est confirmé. On vous attend.' : 'C’est noté. Merci d’avoir répondu.'));
        }}
      />
    </>
  );
}
