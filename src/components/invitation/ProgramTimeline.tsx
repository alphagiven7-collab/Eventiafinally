'use client';

import { EventWithSettings } from '@/types';
import { getEventIdentity } from '@/constants/design-language';

interface ProgramTimelineProps {
  event: EventWithSettings;
}

export default function ProgramTimeline({ event }: ProgramTimelineProps) {
  if (!event.program || event.program.length === 0) return null;
  const identity = getEventIdentity(event.type);

  return (
    <section className="px-4 mt-6 animate-reveal-up">
      <div className="rounded-3xl shadow-sm border p-6 md:p-8" style={{ backgroundColor: identity.palette.surface, borderColor: identity.palette.border }}>
        <h3 className={`${identity.typography.headingClass} ${identity.typography.headingWeight} text-xl md:text-2xl text-center mb-6`} style={{ color: identity.palette.text }}>
          {event.programSectionTitle || 'Programme du jour'}
        </h3>
        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: `linear-gradient(to bottom, ${identity.palette.primaryLight}, ${identity.palette.accentLight}, ${identity.palette.primaryLight})` }} />
          <div className="space-y-5">
            {event.program.map((item, index) => (
              <div key={index} className="relative flex items-center">
                <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-md z-10" style={{ background: `linear-gradient(135deg, ${identity.palette.primary}, ${identity.palette.accent})` }} />
                <div className={`w-1/2 ${index % 2 === 0 ? 'pr-7 text-right' : 'pl-7 ml-auto text-left'}`}>
                  <div className="inline-block p-4 rounded-2xl border shadow-sm transition-all" style={{ backgroundColor: identity.palette.background, borderColor: identity.palette.border }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: identity.palette.primary }}>{item.time}</p>
                    <p className="text-sm font-medium" style={{ color: identity.palette.text }}>{item.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}