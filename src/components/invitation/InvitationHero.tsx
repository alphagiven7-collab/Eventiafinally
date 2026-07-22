'use client';

import { useEffect, useState } from 'react';
import { EventWithSettings } from '@/types';
import { Heart } from 'lucide-react';

interface InvitationHeroProps {
  event: EventWithSettings;
  guestName?: string;
}

export default function InvitationHero({ event, guestName }: InvitationHeroProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const heroPhoto =
    event.hero_image ||
    event.bestPhotos?.[0] ||
    event.branding?.heroImage ||
    event.cover_image ||
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';

  const primaryColor = event.branding?.primaryColor || '#4caf50';

  return (
    <header
      className="relative h-[60vh] flex flex-col justify-center items-center text-center text-white px-4 overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(20, 15, 25, 0.6), rgba(20, 15, 25, 0.8)), url('${heroPhoto}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Ken Burns subtle zoom */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('${heroPhoto}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'ken-burns-soft 20s ease-out forwards',
          opacity: 0.3,
        }}
      />

      {/* Contenu centré */}
      <div className="relative z-10">
        <h1
          className={`font-serif text-2xl md:text-3xl mb-3 tracking-wide transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {event.title}
        </h1>

        <div
          className={`flex justify-center mb-3 transition-all duration-1000 ${
            isVisible ? 'opacity-80 scale-100' : 'opacity-0 scale-50'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          <Heart className="w-6 h-6 text-pink-300 mx-auto animate-pulse" fill="currentColor" />
        </div>

        <p
          className={`text-sm font-light tracking-widest transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '400ms' }}
        >
          {event.coupleLeft && event.coupleRight
            ? `${event.coupleLeft} et ${event.coupleRight}`
            : event.subtitle || ''}
        </p>

        {event.event_date && (
          <p
            className={`text-xs text-white/60 mt-3 transition-all duration-1000 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transitionDelay: '600ms' }}
          >
            {new Date(event.event_date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      {/* Dégradé de transition vers le contenu */}
      <div className="absolute bottom-0 left-0 right-0 h-16 z-10 pointer-events-none bg-gradient-to-t from-[#fafafa] to-transparent" />
    </header>
  );
}