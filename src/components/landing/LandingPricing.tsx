'use client';

import Link from 'next/link';
import { formatUsd, GUEST_PACKS, packTotalUsd, PRICE_PER_GUEST_USD, TRIAL_INVITATIONS } from '@/constants/pricing';

export default function LandingPricing() {
  const unit = formatUsd(PRICE_PER_GUEST_USD);

  return (
    <section className="mx-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-900">Les forfaits</h3>
      </div>
      <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-sm font-bold text-gray-900">{unit} par invité</p>
        <p className="text-[11px] text-gray-500 mt-1">
          {TRIAL_INVITATIONS} invitations d&apos;essai restent en plus du forfait choisi.
        </p>
        <ul className="space-y-2 my-4">
          {GUEST_PACKS.map((count) => (
            <li key={count} className="flex items-center justify-between text-xs text-gray-700">
              <span>{count} invités</span>
              <span className="font-bold">{formatUsd(packTotalUsd(count))}</span>
            </li>
          ))}
        </ul>
        <Link href="/pricing">
          <button className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl">
            Voir le détail
          </button>
        </Link>
      </div>
    </section>
  );
}
