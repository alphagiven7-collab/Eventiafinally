'use client';

import { useState } from 'react';
import { EventWithSettings } from '@/types';

interface GuestBookProps {
  event: EventWithSettings;
}

export default function GuestBook({ event }: GuestBookProps) {
  const [message, setMessage] = useState('');

  return (
    <section className="px-4 mt-8 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h3 className="font-serif text-2xl text-gray-900 text-center mb-2">
          Livre d'or
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6 font-sans">
          Laissez un message aux mariés
        </p>

        {/* Séparateur décoratif */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-300" />
          <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-300" />
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Votre message..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none bg-gray-50 focus:bg-white transition-all"
        />

        <button className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-pink-500 text-white py-3 rounded-2xl text-sm font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 active:scale-95">
          Envoyer mon message
        </button>

        {/* Messages existants */}
        <div className="mt-6 space-y-3">
          {[
            { name: 'Jean K.', message: 'Félicitations ! Que votre bonheur continue !', time: '2h', emoji: '💝' },
            { name: 'Marie L.', message: 'Quelle belle célébration ! Merci de m\'avoir invité.', time: '5h', emoji: '💖' },
          ].map((msg, i) => (
            <div key={i} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{msg.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900">{msg.name}</span>
                    <span className="text-[10px] text-gray-400">{msg.time}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{msg.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}