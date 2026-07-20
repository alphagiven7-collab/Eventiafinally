'use client';

import { EventWithSettings } from '@/types';
import { getEventIdentity } from '@/constants/design-language';

interface PracticalInfoProps {
  event: EventWithSettings;
}

const iconSvg: Record<string, React.ReactElement> = {
  car: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0v6m14-6v6M7 7v2m10-2v2M5 13h14"/></svg>),
  bed: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7v10M3 12h18v5M21 17v-5a2 2 0 0 0-2-2H9V7a2 2 0 0 0-2-2H3"/></svg>),
  wine: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2h8l-1 7a3 3 0 0 1-6 0L8 2zM12 12v8M8 22h8"/></svg>),
  shirt: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 7h20v5H2zM12 22V7M12 7S10 3 7 3 4 7 6 7m6 0s2-4 5-4 3 4 1 4"/></svg>),
  bus: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="3" width="14" height="14" rx="2"/><path d="M5 11h14M9 17l-2 4M15 17l2 4M9 7h.01M15 7h.01"/></svg>),
  gift: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 12v8H4v-8M2 7h20v5H2zM12 22V7M12 7S10 3 7 3 4 7 6 7m6 0s2-4 5-4 3 4 1 4"/></svg>),
  phone: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.09 4.18 2 2 0 0 1 5.11 2h3a2 2 0 0 1 2 1.72c.36 1.55 1.38 2.82 2.68 3.78a10 10 0 0 0 4.53 1.52l.56.07a2 2 0 0 1 1.72 2z"/></svg>),
  info: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>),
  location: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>),
};

const emojiToIcon: Record<string, string> = {
  '🚗': 'car', '🛏️': 'bed', '🍷': 'wine', '👔': 'shirt', '🚌': 'bus', '🎁': 'gift', '📞': 'phone', 'ℹ️': 'info', '📍': 'location',
};

function getIcon(iconKey: string): React.ReactElement | null {
  const iconName = emojiToIcon[iconKey] || iconKey;
  return iconSvg[iconName] || iconSvg.info;
}

export default function PracticalInfo({ event }: PracticalInfoProps) {
  if (!event.practicalInfo || event.practicalInfo.length === 0) return null;
  const identity = getEventIdentity(event.type);

  return (
    <section className="px-4 mt-6 animate-reveal-up">
      <div className="rounded-3xl shadow-sm border p-6 md:p-8" style={{ backgroundColor: identity.palette.surface, borderColor: identity.palette.border }}>
        <h3 className={`${identity.typography.headingClass} ${identity.typography.headingWeight} text-xl md:text-2xl text-center mb-6`} style={{ color: identity.palette.text }}>
          {event.practicalSectionTitle || 'Informations pratiques'}
        </h3>
        <div className="grid gap-3">
          {event.practicalInfo.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl border transition-all"
              style={{ backgroundColor: identity.palette.background, borderColor: identity.palette.border }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${identity.palette.primaryLight}, ${identity.palette.accentLight})`, color: identity.palette.primary }}
                >
                  {getIcon(item.icon)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1" style={{ color: identity.palette.text }}>{item.title}</h4>
                  <p className="text-xs leading-relaxed font-sans" style={{ color: identity.palette.textMuted }}>{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}