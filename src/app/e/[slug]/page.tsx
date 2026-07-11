'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { EventWithSettings } from '@/types';
import { loadEvent } from '@/lib/utils/eventManager';
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

function EventContent() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [event, setEvent] = useState<EventWithSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadEventData() {
      try {
        const loadedEvent = await loadEvent(slug);
        if (!loadedEvent) {
          setError(true);
          return;
        }
        setEvent(loadedEvent);
      } catch (err) {
        console.error('Error loading event:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadEventData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Invitation introuvable</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <InvitationHero event={event} />
      
      <main className="max-w-md mx-auto">
        <InvitationCard event={event} />

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
  );
}

export default function EventInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <EventContent />
    </Suspense>
  );
}
