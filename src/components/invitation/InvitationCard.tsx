'use client';

import { EventWithSettings } from '@/types';
import { getEventIdentity } from '@/constants/design-language';

interface InvitationCardProps {
  event: EventWithSettings;
  guestName?: string;
}

export default function InvitationCard({ event, guestName }: InvitationCardProps) {
  const identity = getEventIdentity(event.type);

  return (
    <section className="px-4 -mt-16 relative z-20 animate-reveal-up">
      <article
        className="backdrop-blur-md rounded-[2.5rem] shadow-2xl border overflow-hidden animate-scale-in"
        style={{
          backgroundColor: identity.palette.glassBg || 'rgba(255, 255, 255, 0.85)',
          borderColor: identity.palette.border,
        }}
      >
        {/* Bande supérieure dégradée */}
        <div
          className="relative h-1.5"
          style={{
            background: `linear-gradient(to right, ${identity.palette.primaryLight}, ${identity.palette.primary}, ${identity.palette.accent})`,
          }}
        />

        <div className="p-6 md:p-10 text-center">
          {/* Overline */}
          <p
            className="text-[11px] uppercase tracking-[0.3em] mb-5 font-medium"
            style={{ color: identity.palette.primary }}
          >
            Vous êtes cordialement invité(e)
          </p>

          {/* Titre */}
          <h2
            className={`${identity.typography.headingClass} ${identity.typography.headingWeight} text-2xl md:text-3xl mb-5 leading-tight italic`}
            style={{ color: identity.palette.text }}
          >
            {event.title}
          </h2>

          {/* Séparateur décoratif */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${identity.palette.primary})` }} />
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" style={{ color: identity.palette.primary }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <div className="h-px w-10" style={{ background: `linear-gradient(to left, transparent, ${identity.palette.primary})` }} />
          </div>

          {/* Couple names */}
          {(event.coupleLeft || event.coupleRight) && (
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className={`${identity.typography.headingClass} text-xl md:text-2xl italic`} style={{ color: identity.palette.text }}>
                {event.coupleLeft || event.title}
              </span>
              <span className="font-serif text-xl md:text-2xl italic" style={{ color: identity.palette.primary }}>
                {event.coupleLeft && event.coupleRight ? '&' : ''}
              </span>
              <span className={`${identity.typography.headingClass} text-xl md:text-2xl italic`} style={{ color: identity.palette.text }}>
                {event.coupleRight || ''}
              </span>
            </div>
          )}

          {/* Personalized greeting */}
          {guestName && (
            <div
              className="mb-5 p-3 rounded-2xl"
              style={{ backgroundColor: identity.palette.accentLight }}
            >
              <p className={`${identity.typography.headingClass} text-base italic`} style={{ color: identity.palette.text }}>
                Cher(e) <span className="font-semibold" style={{ color: identity.palette.primary }}>{guestName}</span>,
              </p>
            </div>
          )}

          {/* Main invitation text */}
          <div className="space-y-3 text-sm md:text-base leading-relaxed" style={{ color: identity.palette.textMuted }}>
            {event.inviteIntro && (
              <p className="font-sans">{event.inviteIntro}</p>
            )}
            {event.inviteSecondary && (
              <p className="italic font-serif">{event.inviteSecondary}</p>
            )}
            {event.mainText && (
              <p className="font-sans" style={{ color: identity.palette.text }}>{event.mainText}</p>
            )}
          </div>

          {/* Date and time emphasis */}
          <div
            className="mt-6 p-4 rounded-2xl border"
            style={{
              backgroundColor: identity.palette.background,
              borderColor: identity.palette.border,
            }}
          >
            {event.event_date && (
              <p className="text-sm font-semibold font-serif italic" style={{ color: identity.palette.text }}>
                {new Date(event.event_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
            {event.location && (
              <p className="text-sm mt-2 font-sans" style={{ color: identity.palette.textMuted }}>
                📍 {event.location}
              </p>
            )}
          </div>
        </div>

        {/* Bande inférieure dégradée */}
        <div
          className="relative h-1.5"
          style={{
            background: `linear-gradient(to right, ${identity.palette.accent}, ${identity.palette.primary}, ${identity.palette.primaryLight})`,
          }}
        />
      </article>
    </section>
  );
}