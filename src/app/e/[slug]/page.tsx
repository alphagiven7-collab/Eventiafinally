'use client';

import { useState, useEffect, use } from 'react';
import InvitationHero from '@/components/invitation/InvitationHero';
import InvitationCard from '@/components/invitation/InvitationCard';
import CountdownTimer from '@/components/invitation/CountdownTimer';
import ProgramTimeline from '@/components/invitation/ProgramTimeline';
import VenueMap from '@/components/invitation/VenueMap';
import PracticalInfo from '@/components/invitation/PracticalInfo';
import DressCode from '@/components/invitation/DressCode';
import PhotoGallery from '@/components/invitation/PhotoGallery';
import GuestBook from '@/components/invitation/GuestBook';
import MusicPlayer from '@/components/invitation/MusicPlayer';
import About from '@/components/invitation/About';
import RsvpButton from '@/components/invitation/RsvpButton';
import { getEventBySlug } from '@/data/events';
import { EventWithSettings } from '@/types';
import { isSupabaseReady } from '@/config/supabase';
import { getEventIdentity, getPalette } from '@/constants/design-language';
import { useTheme } from 'next-themes';

export default function EventInvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
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

      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('invitia_demo_events') || '[]');
        const found = stored.find((e: any) => e.slug === slug);
        if (found && !cancelled) {
          setEvent(found as EventWithSettings);
          setLoading(false);
        }
      }

      // Si on a déjà trouvé l'événement localement, on arrête ici
      if (!cancelled && (hardcoded || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('invitia_demo_events') || '[]').find((e: any) => e.slug === slug)))) {
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
  }, [slug]);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">💍</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation introuvable</h1>
          <p className="text-sm text-gray-600 mb-4">
            Désolé, l'invitation "{slug}" n'existe pas.
          </p>
          <a
            href="/"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-xl text-sm font-semibold transition"
          >
            🏠 Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Gate d'accueil - affiché tant que l'invité n'a pas ouvert l'invitation */}
      {!isGateOpen && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-md flex items-center justify-center px-5">
          <div className="w-full max-w-sm">
            {/* Envelope seal */}
            <div className="relative w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>

            {/* Content */}
            <div className="text-center mb-8">
              <p className="text-[11px] uppercase tracking-[0.25em] text-rose-400 mb-2 font-medium">
                Invitation du cœur
              </p>
              <h1 className="font-serif text-3xl text-white mb-2">
                {event.coupleLeft || event.title} & {event.coupleRight || ''}
              </h1>
              <p className="text-sm text-gray-300 mb-1">
                {event.welcomeMessage}
              </p>
              <p className="text-xs text-gray-400 mt-4 italic">
                Veuillez saisir votre nom pour découvrir votre invitation personnelle.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              const input = (e.currentTarget.querySelector('input') as HTMLInputElement);
              if (input?.value.trim()) {
                handleGateOpen(input.value.trim());
              }
            }} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Votre nom et prénom"
                  className="w-full bg-white/95 border border-rose-100 rounded-xl p-4 text-sm text-gray-700 text-center focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none transition"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white p-4 text-sm font-semibold tracking-wide rounded-xl shadow-lg transition-all active:scale-[0.98]"
              >
                Ouvrir mon invitation
              </button>
            </form>

            {/* Designer access (desktop only) */}
            <div className="hidden md:flex flex-col gap-2 fixed right-5 top-5">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="border border-white/30 bg-black/50 text-white rounded-xl px-4 py-2 text-xs font-semibold backdrop-blur hover:bg-black/70 transition"
              >
                Mode concepteur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal - affiché après l'ouverture */}
      {isGateOpen && mounted && (() => {
        const identity = getEventIdentity(event.type);
        const palette = getPalette(identity, isDark);
        return (
          <div className="min-h-screen transition-colors duration-700" style={{ backgroundColor: palette.background }}>
            <InvitationHero event={event} guestName={guestName || undefined} />
            
            <main className="max-w-md mx-auto relative z-10">
              <InvitationCard event={event} guestName={guestName || undefined} />

              {event.sections?.countdown && (
                <section className="px-4 mt-6">
                  <div className="rounded-3xl shadow-sm border p-6" style={{ backgroundColor: palette.surface, borderColor: palette.border }}>
                    <CountdownTimer targetDate={event.event_date} />
                  </div>
                </section>
              )}

              <PhotoGallery event={event} />
              <ProgramTimeline event={event} />
              <RsvpButton event={event} />
              <VenueMap event={event} />
              <PracticalInfo event={event} />
              <DressCode event={event} />
              <GuestBook event={event} />
              <MusicPlayer event={event} />
              <About event={event} />

              <footer className="px-4 mt-8 mb-20 text-center">
                <div className="rounded-2xl shadow-sm border p-6" style={{ backgroundColor: palette.surface, borderColor: palette.border }}>
                  <p className="text-xs mb-2" style={{ color: palette.textMuted }}>Besoin d'aide ?</p>
                  {event.links?.supportEmail && (
                    <a href={`mailto:${event.links.supportEmail}`} className="text-sm font-medium hover:underline" style={{ color: palette.primary }}>
                      {event.links.supportEmail}
                    </a>
                  )}
                  <p className="text-[10px] mt-4" style={{ color: palette.textMuted }}>
                    © {new Date().getFullYear()} {event.title}
                  </p>
                </div>
              </footer>
            </main>
          </div>
        );
      })()}
    </>
  );
}