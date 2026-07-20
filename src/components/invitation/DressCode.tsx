'use client';

import { EventWithSettings } from '@/types';
import { getEventIdentity } from '@/constants/design-language';

interface DressCodeProps {
  event: EventWithSettings;
}

export default function DressCode({ event }: DressCodeProps) {
  if (!event.dressCodeTitle) return null;
  const identity = getEventIdentity(event.type);

  return (
    <section className="px-4 mt-6 animate-reveal-up">
      <div
        className="rounded-3xl shadow-sm border p-6 md:p-8 text-center"
        style={{ backgroundColor: identity.palette.surface, borderColor: identity.palette.border }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background: `linear-gradient(135deg, ${identity.palette.primaryLight}, ${identity.palette.accentLight})`,
          }}
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke={identity.palette.primary} strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <h3 className={`${identity.typography.headingClass} ${identity.typography.headingWeight} text-xl md:text-2xl mb-2`} style={{ color: identity.palette.text }}>
          {event.dressCodeTitle}
        </h3>
        <p className="text-[10px] uppercase tracking-[0.3em] mb-5 font-medium" style={{ color: identity.palette.textMuted }}>
          Couleurs suggérées
        </p>
        <div className="flex justify-center gap-4">
          {[
            { bg: '#f4e1e1', label: 'Rose poudré' },
            { bg: '#5a2a35', label: 'Bordeaux' },
            { bg: '#f5f5dc', label: 'Crème' },
          ].map((c) => (
            <div key={c.label} className="group">
              <div className="w-14 h-14 rounded-full shadow-lg border-2 border-white group-hover:scale-110 transition-transform" style={{ backgroundColor: c.bg }} />
              <p className="text-[10px] mt-2" style={{ color: identity.palette.textMuted }}>{c.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}