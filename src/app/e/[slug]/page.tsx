'use client';

import { useState, useEffect } from 'react';
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

export default function EventInvitationPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const event = getEventBySlug(slug);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [isGateOpen, setIsGateOpen] = useState(false);

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
      {isGateOpen && (
        <div className="min-h-screen bg-gray-50">
          <InvitationHero event={event} guestName={guestName || undefined} />
          
          <main className="max-w-md mx-auto">
            <InvitationCard event={event} guestName={guestName || undefined} />

            {event.sections?.countdown && (
              <section className="px-4 mt-8">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                  <CountdownTimer targetDate={event.event_date} />
                </div>
              </section>
            )}

            <ProgramTimeline event={event} />
            <RsvpButton event={event} />
            <VenueMap event={event} />
            <PracticalInfo event={event} />
            <DressCode event={event} />
            <PhotoGallery event={event} />
            <GuestBook event={event} />
            <MusicPlayer event={event} />
            <About event={event} />

            <footer className="px-4 mt-8 mb-20 text-center">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-xs text-gray-500 mb-2">Besoin d'aide ?</p>
                {event.links?.supportEmail && (
                  <a href={`mailto:${event.links.supportEmail}`} className="text-sm text-emerald-600 font-medium hover:underline">
                    {event.links.supportEmail}
                  </a>
                )}
                <p className="text-[10px] text-gray-400 mt-4">
                  © {new Date().getFullYear()} {event.title}
                </p>
              </div>
            </footer>
          </main>
        </div>
      )}
    </>
  );
}