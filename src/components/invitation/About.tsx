'use client';

import { EventWithSettings } from '@/types';
import { getEventIdentity } from '@/constants/design-language';

interface AboutProps {
  event: EventWithSettings;
}

export default function About({ event }: AboutProps) {
  if (!event.aboutTitle && !event.mainText) return null;
  const identity = getEventIdentity(event.type);

  return (
    <section className="px-4 mt-6 animate-reveal-up">
      <div
        className="rounded-3xl shadow-sm border p-6 md:p-8"
        style={{ backgroundColor: identity.palette.surface, borderColor: identity.palette.border }}
      >
        <h3 className={`${identity.typography.headingClass} ${identity.typography.headingWeight} text-xl md:text-2xl text-center mb-5`} style={{ color: identity.palette.text }}>
          {event.aboutTitle || 'À propos'}
        </h3>

        {/* Séparateur */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="h-px w-10 rounded-full" style={{ background: `linear-gradient(to right, transparent, ${identity.palette.primary})` }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: identity.palette.primary }} />
          <div className="h-px w-10 rounded-full" style={{ background: `linear-gradient(to left, transparent, ${identity.palette.primary})` }} />
        </div>

        {event.mainText && (
          <div className="text-sm md:text-base leading-relaxed whitespace-pre-line font-sans" style={{ color: identity.palette.textMuted }}>
            {event.mainText}
          </div>
        )}
      </div>
    </section>
  );
}