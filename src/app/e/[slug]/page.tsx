'use client';

import { useState, useEffect, use } from 'react';
import InvitationExperience from '@/components/invitation/InvitationExperience';
import { getEventBySlug } from '@/data/events';
import { EventWithSettings } from '@/types';
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

  // Charger l'événement — LOCAL FIRST pour une expérience instantanée (Mobile First)
  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      if (isSupabaseReady()) {
        try {
          const hosted = await fetchInvitationBySlug(createClient(), slug);
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

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f4f4f6] dark:bg-[#0b0f19]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-pink-50 dark:bg-pink-900/30 text-pink-500 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Invitation introuvable</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Désolé, l'invitation "{slug}" n'existe pas.</p>
          <a href="/" className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white py-3 px-6 rounded-xl text-sm font-semibold transition">
            <Home className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <InvitationExperience
      event={event}
      guestName={matchedGuest?.name}
      guestToken={matchedGuest?.token}
      guestStatus={matchedGuest?.status}
    />
  );
}
