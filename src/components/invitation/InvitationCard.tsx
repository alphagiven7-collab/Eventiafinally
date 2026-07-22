'use client';

import { EventWithSettings } from '@/types';

interface InvitationCardProps {
  event: EventWithSettings;
  guestName?: string;
}

// SVG floral décoratif (identique au modèle original)
const FloralSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none">
    <path d="M12 58c8-18 26-22 34-38 3-6 2-12-1-16" stroke="#111827" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M18 24c6 4 10 10 10 18 0 8-5 14-12 16" stroke="#111827" strokeWidth="1.1" strokeLinecap="round"/>
    <path d="M42 14c-2 8 2 16 8 22" stroke="#111827" strokeWidth="1" strokeLinecap="round"/>
    <circle cx="24" cy="34" r="5" stroke="#111827" strokeWidth="1"/>
    <circle cx="38" cy="22" r="3.5" fill="#111827"/>
    <circle cx="52" cy="30" r="2.5" fill="#111827"/>
    <path d="M20 48c4 6 10 8 16 6" stroke="#111827" strokeWidth="0.9" strokeLinecap="round"/>
  </svg>
);

export default function InvitationCard({ event, guestName }: InvitationCardProps) {
  return (
    <section className="px-4 -mt-12 relative z-10">
      {/* Glass card avec décorations florales — fidèle au modèle */}
      <article
        className="relative overflow-hidden rounded-2xl text-center"
        style={{
          background: `
            radial-gradient(circle at 88% 8%, rgba(236, 72, 153, 0.08), transparent 42%),
            radial-gradient(circle at 12% 92%, rgba(15, 23, 42, 0.04), transparent 40%),
            linear-gradient(168deg, #ffffff 0%, #faf8f6 48%, #f8fafc 100%)
          `,
          boxShadow: '0 20px 44px rgba(17, 24, 39, 0.07)',
          border: '1px solid rgba(15, 23, 42, 0.06)',
        }}
      >
        {/* Overlay floral top */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 28%)',
          }}
        />

        {/* Décoration florale haut-gauche */}
        <div
          className="absolute z-0 pointer-events-none opacity-[0.11]"
          style={{
            top: '0.35rem',
            left: '0.35rem',
            width: 'clamp(4.5rem, 18vw, 6.5rem)',
            height: 'clamp(4.5rem, 18vw, 6.5rem)',
          }}
        >
          <FloralSVG />
        </div>

        {/* Décoration florale bas-droite (retournée) */}
        <div
          className="absolute z-0 pointer-events-none opacity-[0.11]"
          style={{
            bottom: '0.35rem',
            right: '0.35rem',
            width: 'clamp(4.5rem, 18vw, 6.5rem)',
            height: 'clamp(4.5rem, 18vw, 6.5rem)',
            transform: 'rotate(180deg)',
          }}
        >
          <FloralSVG />
        </div>

        {/* Contenu de la carte */}
        <div
          className="relative z-10"
          style={{ padding: 'clamp(1.35rem, 5vw, 1.85rem) clamp(1.1rem, 4.5vw, 1.5rem)' }}
        >
          {/* Overline */}
          <p
            className="uppercase text-gray-400 mb-1"
            style={{
              fontSize: 'clamp(0.5625rem, 2.6vw, 0.6875rem)',
              letterSpacing: '0.28em',
            }}
          >
            Vous êtes cordialement invité(e)
          </p>

          {/* Titre "Invitation" en cursive */}
          <h2
            className="text-gray-900 mb-4"
            style={{
              fontFamily: "'Great Vibes', cursive",
              fontSize: 'clamp(2.35rem, 10vw, 3.15rem)',
              lineHeight: 1.05,
            }}
          >
            Invitation
          </h2>

          {/* Noms du couple en couleurs */}
          <div
            className="flex flex-wrap items-center justify-center mb-4"
            style={{ gap: '0.45rem 0.65rem' }}
          >
            <span
              className="text-pink-600"
              style={{
                fontFamily: "'Great Vibes', cursive",
                fontSize: 'clamp(1.85rem, 7.5vw, 2.35rem)',
                lineHeight: 1.1,
              }}
            >
              {event.coupleLeft || event.title}
            </span>
            <span
              className="text-gray-400 uppercase bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5"
              style={{
                fontSize: 'clamp(0.5625rem, 2.4vw, 0.625rem)',
                letterSpacing: '0.22em',
              }}
            >
              et
            </span>
            <span
              className="text-blue-600"
              style={{
                fontFamily: "'Great Vibes', cursive",
                fontSize: 'clamp(1.85rem, 7.5vw, 2.35rem)',
                lineHeight: 1.1,
              }}
            >
              {event.coupleRight || ''}
            </span>
          </div>

          {/* Salutation personnalisée */}
          {guestName && (
            <p
              className="text-gray-700 mb-3"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(0.9375rem, 3.8vw, 1.0625rem)',
              }}
            >
              Cher/Chère{' '}
              <span className="text-gray-900 font-semibold">{guestName}</span>,
            </p>
          )}

          {/* Texte d'invitation */}
          <div className="space-y-3">
            {event.inviteIntro && (
              <p
                className="text-gray-600 leading-relaxed"
                style={{
                  fontSize: 'clamp(0.8125rem, 3.45vw, 0.9375rem)',
                  lineHeight: 1.68,
                }}
              >
                {event.inviteIntro}
              </p>
            )}

            {event.inviteSecondary && (
              <p
                className="text-gray-600 leading-relaxed"
                style={{
                  fontSize: 'clamp(0.8125rem, 3.45vw, 0.9375rem)',
                  lineHeight: 1.68,
                }}
              >
                {event.inviteSecondary}
              </p>
            )}

            {event.mainText && (
              <p
                className="text-gray-600 leading-relaxed"
                style={{
                  fontSize: 'clamp(0.8125rem, 3.45vw, 0.9375rem)',
                  lineHeight: 1.68,
                }}
              >
                {event.mainText}
              </p>
            )}

            {/* Date et lieu si pas de texte personnalisé */}
            {!event.inviteIntro && !event.mainText && event.event_date && (
              <p
                className="text-gray-600 leading-relaxed"
                style={{
                  fontSize: 'clamp(0.8125rem, 3.45vw, 0.9375rem)',
                  lineHeight: 1.68,
                }}
              >
                C'est avec une grande joie que{' '}
                <strong className="text-gray-900 font-semibold">
                  {event.coupleLeft || event.title} et {event.coupleRight || ''}
                </strong>{' '}
                vous invitent à célébrer leur mariage.
              </p>
            )}

            {!event.inviteIntro && !event.mainText && event.event_date && (
              <p
                className="text-gray-600 leading-relaxed"
                style={{
                  fontSize: 'clamp(0.8125rem, 3.45vw, 0.9375rem)',
                  lineHeight: 1.68,
                }}
              >
                La cérémonie se tiendra le{' '}
                <strong className="text-gray-900 font-semibold">
                  {new Date(event.event_date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
                {event.location && (
                  <>
                    {' '}au{' '}
                    <strong className="text-gray-900 font-semibold">{event.location}</strong>
                  </>
                )}
                .
              </p>
            )}
          </div>
        </div>
      </article>

      {/* Bouton RSVP sous la carte */}
      <div className="mt-4 px-[0.15rem]">
        <button
          type="button"
          className="w-full rounded-xl p-4 shadow-lg transition text-sm font-bold uppercase tracking-widest text-white"
          style={{
            background: `linear-gradient(to right, ${event.branding?.primaryColor || '#ec4899'}, ${event.branding?.accentColor || '#f43f5e'})`,
            minHeight: '3.25rem',
          }}
          onClick={() => {
            const el = document.querySelector('[data-section="rsvp"]');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          {event.reserveText || 'Confirmer ma présence'}
        </button>
      </div>
    </section>
  );
}