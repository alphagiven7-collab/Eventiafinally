'use client';

import { EventWithSettings } from '@/types';
import { getEventIdentity } from '@/constants/design-language';

interface VenueMapProps {
  event: EventWithSettings;
}

export default function VenueMap({ event }: VenueMapProps) {
  if (!event.lat || !event.lng) return null;
  const identity = getEventIdentity(event.type);

  return (
    <section className="px-4 mt-6 animate-reveal-up">
      <div className="rounded-3xl shadow-sm border overflow-hidden" style={{ borderColor: identity.palette.border }}>
        <div className="p-6 md:p-8" style={{ backgroundColor: identity.palette.surface }}>
          <h3 className={`${identity.typography.headingClass} ${identity.typography.headingWeight} text-xl md:text-2xl text-center mb-5`} style={{ color: identity.palette.text }}>
            {event.venueDetails?.title || 'Lieu de réception'}
          </h3>

          <div className="relative rounded-2xl overflow-hidden shadow-lg">
            <div
              className="aspect-video flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${identity.palette.primaryLight}, ${identity.palette.accentLight})` }}
            >
              <div className="text-center p-6">
                <svg className="w-14 h-14 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke={identity.palette.primary} strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <p className="font-serif text-lg mb-1" style={{ color: identity.palette.text }}>{event.location}</p>
                {event.address && (
                  <p className="text-sm font-sans" style={{ color: identity.palette.textMuted }}>{event.address}</p>
                )}
              </div>
            </div>

            <div className="absolute top-4 right-4 px-3 py-2 rounded-full shadow-md flex items-center gap-2 backdrop-blur" style={{ backgroundColor: identity.palette.glassBg }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={identity.palette.primary} strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="text-xs font-medium" style={{ color: identity.palette.text }}>GPS</span>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl" style={{ background: `linear-gradient(to right, ${identity.palette.primaryLight}, ${identity.palette.accentLight})` }}>
            <p className="text-xs text-center font-sans" style={{ color: identity.palette.textMuted }}>
              📍 {event.lat}, {event.lng}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}