'use client';

import { useTranslation } from 'react-i18next';

export default function LandingHowItWorks() {
  const { t } = useTranslation();
  return (
    <section className="mx-4 mt-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-900 text-center mb-4">
          Comment ça marche ?
        </h3>
        
        <div className="space-y-4">
          {[
            { step: '1', emoji: '✏️', title: 'Tu crées en 3 min', desc: 'Choisis ton type d\'événement, remplis les infos, sélectionne un template qui déchire.' },
            { step: '2', emoji: '📤', title: 'Tu partages en 1 clic', desc: 'Un lien WhatsApp unique. Tes invités cliquent, ils ont tout : date, lieu, carte GPS.' },
            { step: '3', emoji: '✅', title: 'Tu sais qui vient', desc: 'RSVP automatique. Plus d\'appels pour relancer les gens. Tu vois tout en temps réel.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm font-bold text-emerald-700">
                  {item.step}
                </div>
                {i < 2 && <div className="w-0.5 h-8 bg-emerald-200 mt-1" />}
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-gray-900">{item.emoji} {item.title}</h4>
                <p className="text-[10px] text-gray-600 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}