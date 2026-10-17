'use client';

import Link from 'next/link';
import { formatUsd, PRICE_PER_GUEST_USD } from '@/constants/pricing';

export default function LandingPricing() {
  const unit = formatUsd(PRICE_PER_GUEST_USD);

  return (
    <section className="mx-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-900">Combien ça coûte ?</h3>
      </div>
      <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-gray-900">Gratuit, puis supplément</h4>
            <p className="text-[10px] text-gray-500">5 invités avec un vrai lien</p>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-gray-900">{unit}</span>
            <span className="text-[10px] text-gray-500"> / invité</span>
          </div>
        </div>
        <ul className="space-y-2 mb-4">
          {[
            'Gratuit : 5 invités, lien partageable',
            `Ensuite : ${unit} par invité`,
            'RSVP, photos, musique et QR inclus',
            'Sans abonnement',
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-xs text-gray-600">
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              {feature}
            </li>
          ))}
        </ul>
        <Link href="/pricing">
          <button className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl">
            Voir le calcul
          </button>
        </Link>
      </div>
    </section>
  );
}
