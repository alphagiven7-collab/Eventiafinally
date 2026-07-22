'use client';

import { useState, useEffect } from 'react';
import { EventWithSettings } from '@/types';
import { getEventIdentity } from '@/constants/design-language';
import RsvpModal from './RsvpModal';

interface InvitationNavProps {
  event: EventWithSettings;
  guestName?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action?: () => void;
}

export default function InvitationNav({ event, guestName }: InvitationNavProps) {
  const identity = getEventIdentity(event.type);
  const [isVisible, setIsVisible] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showRsvpModal, setShowRsvpModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Empêcher le scroll du body quand un modal est ouvert
  useEffect(() => {
    if (activeModal || showRsvpModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [activeModal, showRsvpModal]);

  const scrollToSection = (sectionId: string) => {
    setActiveModal(null);
    setTimeout(() => {
      const el = document.querySelector(`[data-section="${sectionId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  };

  const navItems: NavItem[] = [
    {
      id: 'programme',
      label: 'Programme',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
        </svg>
      ),
      action: () => scrollToSection('programme'),
    },
    {
      id: 'rsvp',
      label: 'R.S.V.P',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      ),
      action: () => setShowRsvpModal(true),
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      ),
      action: () => scrollToSection('photos'),
    },
    {
      id: 'infos',
      label: 'Accès',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      ),
      action: () => scrollToSection('infos'),
    },
  ];

  return (
    <>
      {/* Menu flottant glassmorphism — style inspiré mariage-invitation */}
      <nav
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div
          className="grid grid-cols-4 gap-3 backdrop-blur-xl rounded-[1.75rem] px-5 py-4 shadow-2xl border"
          style={{
            backgroundColor: identity.palette.glassBg || 'rgba(255, 255, 255, 0.75)',
            borderColor: identity.palette.border,
          }}
        >
          {navItems.map((item, index) => (
            <button
              key={item.id}
              onClick={item.action}
              className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-300 active:scale-90 hover:scale-105"
              style={{
                color: identity.palette.primary,
                animationDelay: `${index * 100}ms`,
              }}
            >
              {item.icon}
              <span className="text-[10px] font-semibold tracking-wide">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Ombre colorée subtile */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[80%] h-4 rounded-full blur-xl opacity-30"
          style={{ backgroundColor: identity.palette.primary }}
        />
      </nav>

      {/* Modal Programme */}
      {activeModal === 'programme' && (
        <ModalOverlay onClose={() => setActiveModal(null)} identity={identity}>
          <h3
            className="text-xl font-serif italic mb-4"
            style={{ color: identity.palette.primary }}
          >
            Programme
          </h3>
          <div className="space-y-3 text-sm" style={{ color: identity.palette.text }}>
            {event.program && event.program.length > 0 ? (
              event.program.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="font-semibold min-w-[50px]" style={{ color: identity.palette.primary }}>
                    {item.time}
                  </span>
                  <span>{item.title}</span>
                </div>
              ))
            ) : (
              <p style={{ color: identity.palette.textMuted }}>Le programme sera bientôt disponible.</p>
            )}
          </div>
        </ModalOverlay>
      )}

      {/* Modal Accès / Lieu */}
      {activeModal === 'infos' && (
        <ModalOverlay onClose={() => setActiveModal(null)} identity={identity}>
          <h3
            className="text-xl font-serif italic mb-4"
            style={{ color: identity.palette.primary }}
          >
            Accès
          </h3>
          <div className="text-center text-sm space-y-3" style={{ color: identity.palette.text }}>
            <p className="font-semibold">{event.location || 'Lieu à confirmer'}</p>
            {event.address && (
              <p className="text-xs" style={{ color: identity.palette.textMuted }}>
                {event.address}
              </p>
            )}
            <button
              className="w-full mt-3 py-3 rounded-xl text-white text-sm font-semibold transition-all active:scale-[0.98]"
              style={{ backgroundColor: identity.palette.primary }}
              onClick={() => {
                const query = encodeURIComponent(event.location || '');
                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
              }}
            >
              Ouvrir le GPS
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Modal Photos */}
      {activeModal === 'photos' && (
        <ModalOverlay onClose={() => setActiveModal(null)} identity={identity}>
          <h3
            className="text-xl font-serif italic mb-4"
            style={{ color: identity.palette.primary }}
          >
            Photos
          </h3>
          <p className="text-sm text-center" style={{ color: identity.palette.textMuted }}>
            Faites défiler vers la galerie pour voir toutes les photos.
          </p>
          <button
            className="w-full mt-4 py-3 rounded-xl text-white text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ backgroundColor: identity.palette.primary }}
            onClick={() => scrollToSection('photos')}
          >
            Voir la galerie
          </button>
        </ModalOverlay>
      )}

      {/* Modal RSVP */}
      {showRsvpModal && (
        <RsvpModal event={event} isOpen={showRsvpModal} onClose={() => setShowRsvpModal(false)} />
      )}
    </>
  );
}

// Composant ModalOverlay réutilisable — style mariage-invitation
function ModalOverlay({
  children,
  onClose,
  identity,
}: {
  children: React.ReactNode;
  onClose: () => void;
  identity: ReturnType<typeof getEventIdentity>;
}) {
  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay sombre avec blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal carré arrondi — style mariage-invitation */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-[350px] rounded-[2.5rem] p-6 shadow-2xl border animate-scale-in"
        style={{
          backgroundColor: identity.palette.glassBg || 'rgba(255, 255, 255, 0.95)',
          borderColor: identity.palette.border,
        }}
      >
        {/* Header */}
        <div className="flex justify-end mb-1">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90"
            style={{
              backgroundColor: identity.palette.background,
              color: identity.palette.primary,
            }}
          >
            ×
          </button>
        </div>

        {/* Contenu */}
        <div className="text-center">
          {children}
        </div>
      </div>
    </div>
  );
}