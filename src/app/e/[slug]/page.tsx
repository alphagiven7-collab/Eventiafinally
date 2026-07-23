'use client';

import { useState, useEffect, use } from 'react';
import InvitationExperience from '@/components/invitation/InvitationExperience';
import { getEventBySlug } from '@/data/events';
import { EventWithSettings } from '@/types';
import { isSupabaseReady } from '@/config/supabase';
import { getEventIdentity, getPalette } from '@/constants/design-language';
import { useTheme } from 'next-themes';
import { getUserEvents } from '@/lib/storage';
import { useAuth } from '@/providers/auth-provider';

export default function EventInvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { user } = useAuth();
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
      // 1. TOUJOURS charger d'abord les événements locaux (instantané, pas d'appel réseau)
      const hardcoded = getEventBySlug(slug);
      if (hardcoded && !cancelled) {
        setEvent(hardcoded);
        setLoading(false);
      }

      if (typeof window !== 'undefined' && user?.id) {
        const userEvts = await getUserEvents(user.id);
        const found = userEvts.find((e) => e.slug === slug);
        if (found && !cancelled) {
          setEvent(found);
          setLoading(false);
        }
      }

      // Si on a déjà trouvé l'événement localement, on arrête ici
      if (!cancelled && (hardcoded || (typeof window !== 'undefined' && user?.id && (await getUserEvents(user.id)).find((e) => e.slug === slug)))) {
        setLoading(false);
        return;
      }

      // 2. Essayer Supabase en arrière-plan avec timeout (ne bloque jamais l'UI)
      if (isSupabaseReady()) {
        try {
          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
          );

          const fetchPromise = (async () => {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data } = await supabase
              .from('events')
              .select('*')
              .eq('slug', slug)
              .single();
            return data;
          })();

          const data = await Promise.race([fetchPromise, timeoutPromise]);
          if (data && !cancelled) {
            setEvent(data as EventWithSettings);
            setLoading(false);
            return;
          }
        } catch {
          // Supabase injoignable ou timeout — on continue
        }
      }

      // 3. Rien trouvé
      if (!cancelled) {
        setLoading(false);
      }
    }

    setLoading(true);
    loadEvent();

    return () => { cancelled = true; };
  }, [slug, user?.id]);

  // Récupérer le nom depuis l'URL (paramètre guest)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const guestParam = params.get('guest');
      if (guestParam) {
        // Si un token est dans l'URL, on considère que l'invité a déjà "ouvert" son invitation
        // dans une vraie app, on vérifierait le token dans Supabase
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

  return (
    <>
      <InvitationExperience event={event} guestName={guestName || undefined} />
      {/* Bouton partage WhatsApp flottant */}
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`Tu es invité(e) à "${event.title}" ! Découvre ton invitation ici : ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
        target="_blank"
        rel="noopener"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        title="Partager via WhatsApp"
        aria-label="Partager via WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
        </svg>
      </a>
    </>
  );
}
