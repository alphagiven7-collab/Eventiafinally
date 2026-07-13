'use client';

import { useState } from 'react';
import { EventWithSettings } from '@/types';
import RsvpModal from '@/components/invitation/RsvpModal';

interface RsvpButtonProps {
  event: EventWithSettings;
}

export default function RsvpButton({ event }: RsvpButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="px-4 mt-8 animate-fade-in">
        <div className="bg-gradient-to-br from-emerald-50 to-pink-50 rounded-3xl p-6 md:p-8 border border-emerald-100">
          <div className="text-center">
            <h3 className="font-serif text-2xl text-gray-900 mb-3">
              Confirmez votre présence
            </h3>
            <p className="text-sm text-gray-600 mb-6 font-sans">
              Nous avons hâte de vous voir !
            </p>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                {event.reserveText || 'Confirmer ma présence'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            {event.rsvpDeadlineText && (
              <p className="text-xs text-gray-500 mt-4 font-sans">
                {event.rsvpDeadlineText}
              </p>
            )}
          </div>
        </div>
      </section>

      <RsvpModal
        event={event}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}