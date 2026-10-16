'use client';

import { useState, useEffect, use } from 'react';
import InvitationExperience from '@/components/invitation/InvitationExperience';
import { getEventBySlug } from '@/data/events';
import { EventWithSettings } from '@/types';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { fetchInvitationBySlug } from '@/lib/events/store';

export default function EventInvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [event, setEvent] = useState<EventWithSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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

  // Récupérer le nom et le token depuis l'URL (paramètres guest et token)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const guestParam = params.get('guest');
      const tokenParam = params.get('token');
      if (guestParam) {
        // Vérifier le token si présent (sécurise l'accès)
        if (tokenParam) {
          const storedGuests = localStorage.getItem(`invitia_guests_${slug}`);
          if (storedGuests) {
            try {
              const guests = JSON.parse(storedGuests);
              const found = guests.find((g: any) => g.token === tokenParam);
              if (!found) {
                // Token invalide — on ignore le guest name
                return;
              }
            } catch {}
          }
        }
        localStorage.setItem(`guest_${slug}`, guestParam);
        setIsGateOpen(true);
      }
    }
  }, [slug]);

  // Vérifier si l'invité a déjà ouvert l'invitation
  useEffect(() => {
    if (typeof window !== 'undefined' && slug) {
      const storedGuest = localStorage.getItem(`guest_${slug}`);
      if (storedGuest) {
        setIsGateOpen(true);
        setGuestName(storedGuest);
      }
    }
  }, [slug]);

  const handleGateOpen = (name: string) => {
    setGuestName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`guest_${slug}`, name);
    }
    setIsGateOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f4f6' }}>
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f4f4f6' }}>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">💍</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation introuvable</h1>
          <p className="text-sm text-gray-600 mb-4">Désolé, l'invitation "{slug}" n'existe pas.</p>
          <a href="/" className="inline-block bg-pink-500 hover:bg-pink-600 text-white py-3 px-6 rounded-xl text-sm font-semibold transition">
            🏠 Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  return <InvitationExperience event={event} guestName={guestName || undefined} />;
}
