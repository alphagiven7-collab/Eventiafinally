'use client';

import { useTranslation } from 'react-i18next';

export default function LandingStats() {
  const { t } = useTranslation();
  return (
    <section className="mx-4 mt-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <p className="text-[10px] text-gray-500 text-center mb-3">Ils nous font confiance pour leur événement</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: '2K+', label: 'Événements', desc: 'créés' },
            { value: '15K+', label: 'Invités', desc: 'atteints' },
            { value: '4.9', label: 'Note', desc: 'moyenne' },
            { value: '98%', label: 'Satisf.', desc: 'recommandent' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-lg font-bold text-emerald-600">{stat.value}</div>
              <div className="text-[9px] text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}