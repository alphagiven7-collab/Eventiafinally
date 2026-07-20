'use client';

import { useState } from 'react';
import { EventWithSettings } from '@/types';
import { getEventIdentity } from '@/constants/design-language';
import RsvpModal from '@/components/invitation/RsvpModal';

interface RsvpButtonProps {
  event: EventWithSettings;
}

export default function RsvpButton({ event }: RsvpButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const identity = getEventIdentity(event.type);

  return (
    <>
      <section className="px-4 mt-6 animate-reveal-up">
        <div
          className="rounded-3xl p-6 md:p-8 border"
          style={{
            background: `linear-gradient(135deg, ${identity.palette.primaryLight}, ${identity.palette.accentLight})`,
            borderColor: identity.palette.border,
          }}
        >
          <div className="text-center">
            <h3 className={`${identity.typography.headingClass} ${identity.typography.headingWeight} text-xl md:text-2xl mb-2`} style={{ color: identity.palette.text }}>
              Confirmez votre présence
            </h3>
            <p className="text-sm mb-5 font-sans" style={{ color: identity.palette.textMuted }}>
              Nous avons hâte de vous voir !
            </p>

            <button
              onClick={() => setIsModalOpen(true)}
              className="group relative px-8 py-4 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
              style={{ background: `linear-gradient(to right, ${identity.palette.primary}, ${identity.palette.accent})` }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                {event.reserveText || 'Confirmer ma présence'}
              </span>
            </button>

            {event.rsvpDeadlineText && (
              <p className="text-xs mt-4 font-sans" style={{ color: identity.palette.textMuted }}>
                {event.rsvpDeadlineText}
              </p>
            )}
          </div>
        </div>
      </section>

      <RsvpModal event={event} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}