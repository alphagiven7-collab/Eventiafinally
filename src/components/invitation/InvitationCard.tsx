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
        className="backdrop-blur-sm rounded-3xl shadow-2xl border overflow-hidden animate-scale-in"
        style={{ backgroundColor: identity.palette.surface, borderColor: identity.palette.border }}
      >
        {/* Ornements supérieurs */}
        <div
          className="relative h-2"
          style={{
            background: `linear-gradient(to right, ${identity.palette.primaryLight}, ${identity.palette.primary}, ${identity.palette.accent})`,
          }}
        />

        <div className="p-6 md:p-10 text-center">
          {/* Overline */}
          <p
            className="text-[11px] uppercase tracking-[0.3em] mb-6 font-medium"
            style={{ color: identity.palette.primary }}
          >
            Vous êtes cordialement invité(e)
          </p>

          {/* Titre */}
          <h2
            className={`${identity.typography.headingClass} ${identity.typography.headingWeight} text-2xl md:text-3xl mb-6 leading-tight`}
            style={{ color: identity.palette.text }}
          >
            Invitation
          </h2>

          {/* Séparateur décoratif */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${identity.palette.primary})` }} />
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" style={{ color: identity.palette.primary }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${identity.palette.primary})` }} />
          </div>

          {/* Couple names */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className={`${identity.typography.headingClass} text-xl md:text-2xl`} style={{ color: identity.palette.text }}>
              {event.coupleLeft || event.title}
            </span>
            <span className="font-serif text-xl md:text-2xl italic" style={{ color: identity.palette.primary }}>
              {event.coupleLeft && event.coupleRight ? '&' : ''}
            </span>
            <span className={`${identity.typography.headingClass} text-xl md:text-2xl`} style={{ color: identity.palette.text }}>
              {event.coupleRight || ''}
            </span>
          </div>

          {/* Personalized greeting */}
          {guestName && (
            <div
              className="mb-6 p-4 rounded-2xl"
              style={{ backgroundColor: identity.palette.accentLight }}
            >
              <p className={`${identity.typography.headingClass} text-lg`} style={{ color: identity.palette.text }}>
                Cher(e) <span className="font-semibold" style={{ color: identity.palette.primary }}>{guestName}</span>,
              </p>
            </div>
          )}

          {/* Main invitation text */}
          <div className="space-y-4 text-sm md:text-base leading-relaxed" style={{ color: identity.palette.textMuted }}>
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
            className="mt-8 p-5 rounded-2xl border"
            style={{ backgroundColor: identity.palette.background, borderColor: identity.palette.border }}
          >
            <p className={`text-sm font-semibold font-serif`} style={{ color: identity.palette.text }}>
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
              <p className="text-sm mt-2 font-sans" style={{ color: identity.palette.textMuted }}>
                📍 {event.location}
              </p>
            )}
          </div>
        </div>

        {/* Ornements inférieurs */}
        <div
          className="relative h-2"
          style={{
            background: `linear-gradient(to right, ${identity.palette.accent}, ${identity.palette.primary}, ${identity.palette.primaryLight})`,
          }}
        />
      </article>
    </section>
  );
}
