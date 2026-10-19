'use client';

import { useState, useEffect, use } from 'react';
import InvitationExperience from '@/components/invitation/InvitationExperience';
import { getEventBySlug } from '@/data/events';
import { EventWithSettings, GuestStatus } from '@/types';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { fetchInvitationBySlug } from '@/lib/events/store';
import { lookupGuestByToken, PublicGuest } from '@/lib/guests/store';
import { Heart, Home } from 'lucide-react';

export default function EventInvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [event, setEvent] = useState<EventWithSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedGuest, setResolvedGuest] = useState<PublicGuest | null>(null);
  const [liveStatus, setLiveStatus] = useState<GuestStatus | null>(null);
  const [rsvpNotice, setRsvpNotice] = useState('');

  // Charger l'événement — LOCAL FIRST pour une expérience instantanée (Mobile First)
  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      if (isSupabaseReady()) {
        try {
          const hosted = await fetchInvitationBySlug(createClient(), slug, { includeMusic: false });
          if (hosted && !cancelled) {
            setEvent(hosted);
            setLoading(false);
            return;
          }
        } catch {
          // L'exemple statique reste disponible si le serveur ne répond pas.
        }
      }

      const demo = getEventBySlug(slug);
      if (!cancelled) {
        setEvent(demo);
        setLoading(false);
      }
    }

    setLoading(true);
    loadEvent();

    return () => { cancelled = true; };
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
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Désolé, l'invitation "{slug}" n'existe pas.</p>
          <a href="/" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-3 px-6 rounded-xl text-sm font-semibold transition">
            <Home className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </a>
        </div>
      </div>
    );
  }

  const shownStatus = liveStatus || matchedGuest?.status;

  return (
    <>
      {rsvpNotice && (
        <div className="fixed inset-x-3 bottom-4 z-[80] rounded-2xl bg-violet-700 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
          {rsvpNotice}
        </div>
      )}
      <InvitationExperience
        event={event}
        guestName={matchedGuest?.name}
        guestToken={matchedGuest?.token}
        guestStatus={shownStatus}
        guestTable={matchedGuest?.table_number}
        onRsvp={(result) => {
          if (result.error) {
            setLiveStatus(null);
            setRsvpNotice(result.error);
            return;
          }
          setLiveStatus(result.status);
          setRsvpNotice(result.notice || (result.status === 'confirmed' ? 'Présence confirmée. Merci !' : 'Votre réponse est enregistrée.'));
        }}
      />
    </>
  );
}
