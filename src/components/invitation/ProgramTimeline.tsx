'use client';

import { EventWithSettings } from '@/types';

interface ProgramTimelineProps {
  event: EventWithSettings;
}

export default function ProgramTimeline({ event }: ProgramTimelineProps) {
  if (!event.program || event.program.length === 0) return null;

  return (
    <section className="px-4 mt-8 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h3 className="font-serif text-2xl text-gray-900 text-center mb-8">
          {event.programSectionTitle || 'Programme du jour'}
        </h3>

        {/* Timeline avec design premium */}
        <div className="relative">
          {/* Ligne centrale */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-200 via-pink-200 to-emerald-200 -translate-x-1/2" />

          {/* Items du programme */}
          <div className="space-y-6">
            {event.program.map((item, index) => (
              <div key={index} className="relative flex items-center">
                {/* Point sur la timeline */}
                <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-pink-400 shadow-md z-10" />

                {/* Contenu de gauche ou droite selon l'index */}
                <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 ml-auto text-left'}`}>
                  <div className="inline-block p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <p className="text-xs font-semibold text-emerald-600 mb-1">
                      {item.time}
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      {item.title}
                    </p>
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