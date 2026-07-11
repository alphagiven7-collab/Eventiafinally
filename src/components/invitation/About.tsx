'use client';

import { EventWithSettings } from '@/types';

interface AboutProps {
  event: EventWithSettings;
}

export default function About({ event }: AboutProps) {
  if (!event.aboutTitle && !event.mainText) return null;

  return (
    <section className="px-4 mt-8 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h3 className="font-serif text-2xl text-gray-900 text-center mb-6">
          {event.aboutTitle || 'À propos'}
        </h3>
        
        {/* Séparateur décoratif */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-300" />
          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-400 to-pink-400" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-300" />
        </div>
        
        {event.mainText && (
          <div className="text-sm md:text-base text-gray-600 leading-relaxed whitespace-pre-line font-sans">
            {event.mainText}
          </div>
        )}
      </div>
    </section>
  );
}