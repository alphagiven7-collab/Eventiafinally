'use client';

import { useState, useEffect } from 'react';
import { EventWithSettings } from '@/types';
import { useTheme } from 'next-themes';
import RsvpModal from './RsvpModal';

interface InvitationNavProps {
  event: EventWithSettings;
  guestName?: string;
}

export default function InvitationNav({ event, guestName }: InvitationNavProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [mounted, setMounted] = useState(false);
  const [showRsvpModal, setShowRsvpModal] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  if (!mounted) return null;

  return (
    <>
      {/* Outils flottants — identiques au modèle original */}
      <div
        className="fixed top-3 right-3 z-50 flex items-center gap-2"
        style={{ animation: 'fade-in 0.6s ease-out 1s both' }}
      >
        {/* Toggle thème clair/sombre */}
        <button
          onClick={toggleTheme}
          className="relative w-10 h-6 rounded-full transition-colors duration-300 border"
          style={{
            backgroundColor: isDark ? '#374151' : '#e5e7eb',
            borderColor: isDark ? '#4b5563' : '#d1d5db',
          }}
          title={isDark ? 'Mode clair' : 'Mode sombre'}
        >
          <span
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 flex items-center justify-center text-[10px]"
            style={{
              transform: isDark ? 'translateX(18px)' : 'translateX(2px)',
            }}
          >
            {isDark ? '☽' : '☀'}
          </span>
        </button>
      </div>

      {/* Modal RSVP */}
      {showRsvpModal && (
        <RsvpModal event={event} isOpen={showRsvpModal} onClose={() => setShowRsvpModal(false)} />
      )}
    </>
  );
}