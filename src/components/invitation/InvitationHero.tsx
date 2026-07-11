'use client';

import { EventWithSettings } from '@/types';
import Image from 'next/image';

interface InvitationHeroProps {
  event: EventWithSettings;
  guestName?: string;
}

export default function InvitationHero({ event, guestName }: InvitationHeroProps) {
  return (
    <header className="relative h-[70vh] min-h-[500px] flex flex-col justify-center items-center text-center px-4 overflow-hidden">
      {/* Background image avec overlay amélioré */}
      {event.branding?.heroImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={event.branding.heroImage}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
      )}

      {/* Ornements floraux décoratifs */}
      <div className="absolute top-10 left-4 w-24 h-24 opacity-20 animate-fade-in">
        <svg viewBox="0 0 100 100" fill="none" stroke="white" strokeWidth="0.5">
          <circle cx="50" cy="50" r="45" />
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="15" />
        </svg>
      </div>
      <div className="absolute bottom-10 right-4 w-24 h-24 opacity-20 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <svg viewBox="0 0 100 100" fill="none" stroke="white" strokeWidth="0.5">
          <circle cx="50" cy="50" r="45" />
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="15" />
        </svg>
      </div>

      {/* Séparateur élégant */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 animate-scale-in">
        <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
          <path d="M0 12 L40 0 L80 12 L40 24 Z" fill="white" opacity="0.6" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl animate-slide-up">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-4 tracking-wide leading-tight text-balance">
          {event.title}
        </h1>
        
        {/* Heart icon avec animation */}
        <div className="flex justify-center mb-4 animate-scale-in" style={{ animationDelay: '150ms' }}>
          <svg 
            className="w-8 h-8 text-pink-300 animate-pulse" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>

        {/* Subtitle avec typographie élégante */}
        <p className="text-base md:text-lg font-light tracking-[0.2em] text-white/90 font-serif italic animate-slide-up" style={{ animationDelay: '100ms' }}>
          {event.subtitle}
        </p>

        {/* Message personnalisé */}
        {guestName && (
          <p className="text-white/80 text-base mt-6 animate-fade-in font-sans">
            Cher(e) <span className="font-semibold text-white">{guestName}</span>,
          </p>
        )}

        {/* Message d'accueil */}
        {event.welcomeMessage && (
          <p className="text-white/70 text-sm md:text-base mt-6 max-w-lg mx-auto leading-relaxed font-sans animate-fade-up" style={{ animationDelay: '300ms' }}>
            {event.welcomeMessage}
          </p>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M19 12l-7 7-7-7"/>
        </svg>
      </div>
    </header>
  );
}