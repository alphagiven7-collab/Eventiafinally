'use client';

import { EventWithSettings } from '@/types';

interface PracticalInfoProps {
  event: EventWithSettings;
}

// Mapping des emojis vers des SVG icons
const iconMap: Record<string, React.ReactElement> = {
  '🚗': (
    <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0v6m14-6v6M7 17v2m10-2v2M5 13h14"/>
    </svg>
  ),
  '🛏️': (
    <svg className="w-6 h-6 text-pink-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 7v10M3 12h18v5M21 17v-5a2 2 0 0 0-2-2H9V7a2 2 0 0 0-2-2H3"/>
    </svg>
  ),
  '🍷': (
    <svg className="w-6 h-6 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2h8l-1 7a3 3 0 0 1-6 0L8 2zM12 12v8M8 22h8"/>
    </svg>
  ),
  '📍': (
    <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  '🚆': (
    <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="3" width="14" height="14" rx="2"/>
      <path d="M5 11h14M9 17l-2 4M15 17l2 4M9 7h.01M15 7h.01"/>
    </svg>
  ),
  '✈️': (
    <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>
    </svg>
  ),
  '🎁': (
    <svg className="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 12v8H4v-8M2 7h20v5H2zM12 22V7M12 7S10 3 7 3 4 7 6 7m6 0s2-4 5-4 3 4 1 4"/>
    </svg>
  ),
  '💡': (
    <svg className="w-6 h-6 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 18h6M10 21h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>
    </svg>
  ),
};

export default function PracticalInfo({ event }: PracticalInfoProps) {
  if (!event.practicalInfo || event.practicalInfo.length === 0) return null;

  return (
    <section className="px-4 mt-8 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h3 className="font-serif text-2xl text-gray-900 text-center mb-8">
          {event.practicalSectionTitle || 'Informations pratiques'}
        </h3>

        <div className="grid gap-4">
          {event.practicalInfo.map((item, index) => (
            <div
              key={index}
              className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Icon SVG */}
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  {iconMap[item.icon] || (
                    <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M12 8v4M12 16h.01"/>
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h4 className="font-serif text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed font-sans">
                    {item.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
