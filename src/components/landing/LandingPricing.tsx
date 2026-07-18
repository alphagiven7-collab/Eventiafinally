'use client';

import Link from 'next/link';

export default function LandingPricing() {
  return (
    <section className="mx-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-900">Combien ça coûte ?</h3>
      </div>
      <div className="space-y-3">
        {/* Free */}
        <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Gratuit</h4>
              <p className="text-[10px] text-gray-500">Pour ceux qui veulent tester</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-gray-900">0€</span>
              <span className="text-[10px] text-gray-500">/événement</span>
            </div>
          </div>
          <ul className="space-y-2 mb-4">
            {['1 événement — déjà 50 invités', '3 templates pros', 'RSVP de base', 'Sans expiration'].map((f, j) => (
              <li key={j} className="flex items-center gap-2 text-xs text-gray-600">
                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {f}
              </li>
            ))}
          </ul>
          <Link href="/create">
            <button className="w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98]">
              Commencer — c'est gratuit
            </button>
          </Link>
        </div>

        {/* Premium */}
        <div className="relative p-5 bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl shadow-lg">
          <div className="absolute -top-2.5 right-4 px-3 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full shadow-sm">
            ⭐ Le + choisi
          </div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-white">Premium</h4>
              <p className="text-[10px] text-emerald-200">Pour les événements importants</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-amber-300">20€</span>
              <span className="text-[10px] text-white/60">/événement</span>
            </div>
          </div>
          <ul className="space-y-2 mb-4">
            {['Événements illimités — plus de limites', 'Invités illimités', 'Tous les templates + exclusifs', 'RSVP avancé + statistiques', 'Support prioritaire'].map((f, j) => (
              <li key={j} className="flex items-center gap-2 text-xs text-white/90">
                <svg className="w-4 h-4 text-amber-300 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {f}
              </li>
            ))}
          </ul>
          <Link href="/create">
            <button className="w-full py-2.5 bg-white text-emerald-700 text-sm font-bold rounded-xl shadow-md hover:bg-gray-50 transition-all active:scale-[0.98]">
              Essayer Premium
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}