'use client';

import { useState } from 'react';
import { EventWithSettings } from '@/types';
import { getEventIdentity } from '@/constants/design-language';

interface GuestBookProps {
  event: EventWithSettings;
}

export default function GuestBook({ event }: GuestBookProps) {
  const [message, setMessage] = useState('');
  const identity = getEventIdentity(event.type);

  return (
    <section className="px-4 mt-6 animate-reveal-up">
      <div
        className="rounded-3xl shadow-sm border p-6 md:p-8"
        style={{ backgroundColor: identity.palette.surface, borderColor: identity.palette.border }}
      >
        <h3 className={`${identity.typography.headingClass} ${identity.typography.headingWeight} text-xl md:text-2xl text-center mb-2`} style={{ color: identity.palette.text }}>
          Livre d'or
        </h3>
        <p className="text-sm text-center mb-5 font-sans" style={{ color: identity.palette.textMuted }}>
          Laissez un message
        </p>

        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="h-px w-10 rounded-full" style={{ background: `linear-gradient(to right, transparent, ${identity.palette.primary})` }} />
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={identity.palette.primary} strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <div className="h-px w-10 rounded-full" style={{ background: `linear-gradient(to left, transparent, ${identity.palette.primary})` }} />
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Votre message..."
          rows={3}
          className="w-full px-4 py-3 border rounded-2xl text-sm focus:ring-2 outline-none resize-none transition-all"
          style={{
            borderColor: identity.palette.border,
            backgroundColor: identity.palette.background,
            color: identity.palette.text,
          }}
        />

        <button
          className="w-full mt-3 text-white py-3 rounded-2xl text-sm font-semibold hover:shadow-lg transition-all duration-300 active:scale-95"
          style={{
            background: `linear-gradient(to right, ${identity.palette.primary}, ${identity.palette.accent})`,
          }}
        >
          Envoyer mon message
        </button>

        {/* Messages existants */}
        <div className="mt-5 space-y-3">
          {[
            { name: 'Jean K.', message: 'Félicitations ! Que votre bonheur continue !', time: '2h', emoji: '💝' },
            { name: 'Marie L.', message: 'Quelle belle célébration ! Merci de m\'avoir invité.', time: '5h', emoji: '💖' },
          ].map((msg, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border hover:shadow-sm transition-all"
              style={{
                background: `linear-gradient(135deg, ${identity.palette.background}, ${identity.palette.surface})`,
                borderColor: identity.palette.border,
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{msg.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold" style={{ color: identity.palette.text }}>{msg.name}</span>
                    <span className="text-[10px]" style={{ color: identity.palette.textMuted }}>{msg.time}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: identity.palette.textMuted }}>{msg.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}