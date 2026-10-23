'use client';

import { useState } from 'react';
import { CONTACT_MESSAGE, TEAM_WHATSAPP_URL } from '@/constants/contact';

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.84 9.84 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 8.23 8.25c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z" />
    </svg>
  );
}

export { WhatsAppGlyph };

export default function WhatsAppFloat() {
  const [bubbleOpen, setBubbleOpen] = useState(true);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-end gap-2 sm:bottom-6 sm:right-6">
      {bubbleOpen && (
        <div className="relative mb-1 max-w-[190px] rounded-2xl rounded-br-sm bg-white px-3.5 py-2.5 text-xs font-medium leading-snug text-gray-800 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:text-gray-100 dark:ring-white/10">
          Discuter avec un membre de l’équipe
          <button
            type="button"
            onClick={() => setBubbleOpen(false)}
            aria-label="Fermer"
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-600 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100"
          >
            ✕
          </button>
        </div>
      )}
      <a
        href={`${TEAM_WHATSAPP_URL}?text=${encodeURIComponent(CONTACT_MESSAGE)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Discuter avec un membre de l’équipe sur WhatsApp"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-xl shadow-emerald-600/30 transition hover:scale-105 active:scale-95"
      >
        <WhatsAppGlyph className="h-7 w-7" />
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">1</span>
        </span>
      </a>
    </div>
  );
}
