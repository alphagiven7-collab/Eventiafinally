'use client';

import { EventWithSettings } from '@/types';

interface InvitationCardProps {
  event: EventWithSettings;
  guestName?: string;
}

export default function InvitationCard({ event, guestName }: InvitationCardProps) {
  return (
    <section className="px-4 -mt-16 relative z-20 animate-fade-in">
      <article className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Ornements supérieurs */}
        <div className="relative h-3 bg-gradient-to-r from-rose-400 via-pink-400 to-rose-400" />
        
        <div className="p-8 md:p-10 text-center">
          {/* Overline élégant */}
          <p className="text-[11px] uppercase tracking-[0.3em] text-rose-400 mb-6 font-medium">
            Vous êtes cordialement invité(e)
          </p>

          {/* Titre avec typographie premium */}
          <h2 className="font-serif text-3xl md:text-4xl text-gray-800 mb-8 leading-tight">
            Invitation
          </h2>

          {/* Séparateur décoratif */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-rose-300" />
            <svg className="w-5 h-5 text-rose-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-rose-300" />
          </div>

          {/* Couple names */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="font-serif text-2xl md:text-3xl text-gray-800">
              {event.coupleLeft || '...'}
            </span>
            <span className="text-rose-400 font-serif text-2xl md:text-3xl italic">&</span>
            <span className="font-serif text-2xl md:text-3xl text-gray-800">
              {event.coupleRight || '...'}
            </span>
          </div>

          {/* Personalized greeting */}
          {guestName && (
            <div className="mb-6 p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl">
              <p className="font-serif text-lg text-gray-700">
                Cher(e) <span className="font-semibold text-rose-600">{guestName}</span>,
              </p>
            </div>
          )}

          {/* Main invitation text */}
          <div className="space-y-4 text-sm md:text-base text-gray-600 leading-relaxed">
            <p dangerouslySetInnerHTML={{ __html: event.inviteIntro }} />
            
            {event.inviteSecondary && (
              <p className="text-gray-500 italic font-serif">
                {event.inviteSecondary}
              </p>
            )}

            {event.mainText && (
              <div 
                className="text-gray-700 font-sans"
                dangerouslySetInnerHTML={{ __html: event.mainText }}
              />
            )}
          </div>

          {/* Date and time emphasis */}
          <div className="mt-8 p-6 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl border border-rose-100">
            <p className="text-sm font-semibold text-gray-800 font-serif">
              📅 {event.event_date ? new Date(event.event_date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Date à confirmer'}
            </p>
            {event.location && (
              <p className="text-sm text-gray-600 mt-2 font-sans">
                📍 {event.location}
              </p>
            )}
          </div>
        </div>

        {/* Ornements inférieurs */}
        <div className="relative h-3 bg-gradient-to-r from-rose-400 via-pink-400 to-rose-400" />
      </article>
    </section>
  );
}