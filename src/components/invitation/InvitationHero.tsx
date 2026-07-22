'use client';

import { useEffect, useRef, useState } from 'react';
import { EventWithSettings } from '@/types';
import { getEventIdentity } from '@/constants/design-language';
import { ChevronDown } from 'lucide-react';

interface InvitationHeroProps {
  event: EventWithSettings;
  guestName?: string;
}

export default function InvitationHero({ event, guestName }: InvitationHeroProps) {
  const identity = getEventIdentity(event.type);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const heroPhoto =
    event.hero_image ||
    event.bestPhotos?.[0] ||
    event.branding?.heroImage ||
    event.cover_image ||
    event.branding?.welcomeImage ||
    '';

  return (
    <header
      ref={containerRef}
      className="relative h-screen min-h-[600px] max-h-[900px] flex flex-col justify-end items-center text-center overflow-hidden"
      style={{ backgroundColor: identity.palette.background }}
    >
      {/* Photo de fond avec effet Ken Burns */}
      {heroPhoto && (
        <div className="absolute inset-0 z-0">
          <img
            src={heroPhoto}
            alt={event.title}
            className="w-full h-full object-cover"
            style={{ animation: 'ken-burns-soft 20s ease-out forwards' }}
            loading="eager"
          />
          {/* Overlay dégradé — plus subtil en haut, progressif en bas */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
          {/* Overlay de la couleur primaire de l'identité */}
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{ backgroundColor: identity.palette.primary }}
          />
        </div>
      )}

      {/* Ornements décoratifs — subtils, élégants */}
      <div className="absolute top-12 left-6 z-10 opacity-30">
        <svg width="60" height="60" viewBox="0 0 100 100" fill="none" stroke={identity.palette.primary} strokeWidth="0.5" className="animate-fade-in">
          <circle cx="50" cy="50" r="45" />
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="15" strokeWidth="1" />
        </svg>
      </div>
      <div className="absolute bottom-20 right-6 z-10 opacity-30" style={{ animationDelay: '300ms' }}>
        <svg width="60" height="60" viewBox="0 0 100 100" fill="none" stroke={identity.palette.accent} strokeWidth="0.5" className="animate-fade-in">
          <circle cx="50" cy="50" r="45" />
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="15" strokeWidth="1" />
        </svg>
      </div>

      {/* Séparateur ornemental */}
      <div className="absolute bottom-[42%] left-1/2 -translate-x-1/2 z-10">
        <svg width="100" height="16" viewBox="0 0 100 16" fill="none" className={`${isVisible ? 'opacity-60' : 'opacity-0'} transition-opacity duration-1000`}>
          <path d="M0 8 L50 0 L100 8 L50 16 Z" fill={identity.palette.primary} />
        </svg>
      </div>

      {/* Contenu — centré en bas */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-6 pb-16 md:pb-20">
        {/* Catégorie tag */}
        <p
          className={`text-xs uppercase tracking-[0.3em] mb-3 transition-all ${identity.animations.transitionSpeed} ${isVisible ? 'opacity-80 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ color: identity.palette.primaryLight }}
        >
          {identity.emoji} {identity.name}
        </p>

        {/* Titre principal — typographie serif, grande taille */}
        <h1
          className={`${identity.typography.headingClass} ${identity.typography.headingWeight} ${identity.typography.letterSpacing} text-3xl sm:text-4xl md:text-5xl text-white mb-4 leading-tight text-balance transition-all ${identity.animations.transitionSpeed}`}
          style={{ transitionDelay: '150ms', opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          {event.title}
        </h1>

        {/* Icône cœur avec animation pulse */}
        <div
          className={`flex justify-center mb-4 transition-all duration-1000 ${isVisible ? 'opacity-80 scale-100' : 'opacity-0 scale-50'}`}
          style={{ transitionDelay: '300ms' }}
        >
          <svg className="w-7 h-7 animate-pulse" viewBox="0 0 24 24" fill="currentColor" style={{ color: identity.palette.primary }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>

        {/* Sous-titre */}
        {event.subtitle && (
          <p
            className={`text-base md:text-lg font-light tracking-[0.15em] text-white/80 italic mb-2 transition-all ${identity.animations.transitionSpeed}`}
            style={{ transitionDelay: '400ms', opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(15px)' }}
          >
            {event.subtitle}
          </p>
        )}

        {/* Ligne ornementale */}
        <div
          className={`w-12 h-[1px] mx-auto my-3 transition-all duration-1000`}
          style={{
            backgroundColor: identity.palette.primary,
            transitionDelay: '500ms',
            opacity: isVisible ? 0.6 : 0,
          }}
        />

        {/* Message personnalisé pour l'invité */}
        {guestName && (
          <p
            className={`text-white/85 text-sm mt-4 font-sans transition-all duration-1000`}
            style={{ transitionDelay: '600ms', opacity: isVisible ? 1 : 0 }}
          >
            Cher(e) <span className="font-semibold text-white">{guestName}</span>,
          </p>
        )}

        {/* Message d'accueil */}
        {event.welcomeMessage && (
          <p
            className={`text-white/65 text-xs md:text-sm mt-3 max-w-md mx-auto leading-relaxed font-sans transition-all duration-1000`}
            style={{ transitionDelay: '700ms', opacity: isVisible ? 1 : 0 }}
          >
            {event.welcomeMessage}
          </p>
        )}

        {/* Date et lieu — style élégant */}
        {event.event_date && (
          <div
            className={`mt-6 transition-all duration-1000`}
            style={{ transitionDelay: '800ms', opacity: isVisible ? 1 : 0 }}
          >
            <p className="text-white/90 text-sm font-serif italic">
              {new Date(event.event_date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            {event.location && (
              <p className="text-white/60 text-xs mt-1 font-sans">{event.location}</p>
            )}
          </div>
        )}
      </div>

      {/* Indicateur de scroll — discret */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-10 transition-all duration-1000 ${isVisible ? 'opacity-50' : 'opacity-0'}`}
        style={{ transitionDelay: '900ms' }}
      >
        <ChevronDown className="w-5 h-5 text-white animate-bounce" />
      </div>

      {/* Dégradé de transition vers le contenu (soft) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(to top, ${identity.palette.background}, transparent)`,
        }}
      />
    </header>
  );
}