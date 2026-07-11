'use client';

import { useState } from 'react';
import { EventWithSettings } from '@/types';
import Image from 'next/image';

interface GuestGateProps {
  event: EventWithSettings;
  onOpen: (guestName: string) => void;
}

export default function GuestGate({ event, onOpen }: GuestGateProps) {
  const [guestName, setGuestName] = useState('');
  const [isOpening, setIsOpening] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestName.trim()) {
      setIsOpening(true);
      // Simulate opening animation
      setTimeout(() => {
        onOpen(guestName.trim());
      }, 800);
    }
  };

  // Check if guest is returning (has token in URL)
  const isReturningGuest = typeof window !== 'undefined' && window.location.search.includes('guest=');

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-md flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {/* Envelope seal */}
        <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <p className="text-[11px] uppercase tracking-[0.25em] text-rose-400 mb-2 font-medium">
            Invitation du cœur
          </p>
          <h1 className="font-serif text-3xl text-white mb-2">
            {event.coupleLeft || event.title} & {event.coupleRight || ''}
          </h1>
          <p className="text-sm text-gray-300 mb-1">
            {event.welcomeMessage}
          </p>
          <p className="text-xs text-gray-400 mt-4 italic">
            {event.gateHint}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Votre nom et prénom"
              className="w-full bg-white/95 border border-rose-100 rounded-xl p-4 text-sm text-gray-700 text-center focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none transition"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!guestName.trim() || isOpening}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white p-4 text-sm font-semibold tracking-wide rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isOpening ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Ouverture...
              </span>
            ) : (
              'Ouvrir mon invitation'
            )}
          </button>
        </form>

        {/* Designer access (desktop only) */}
        <div className="hidden md:flex flex-col gap-2 fixed right-5 top-5">
          <button
            onClick={() => window.location.href = '/admin'}
            className="border border-white/30 bg-black/50 text-white rounded-xl px-4 py-2 text-xs font-semibold backdrop-blur hover:bg-black/70 transition"
          >
            Mode concepteur
          </button>
        </div>
      </div>
    </div>
  );
}