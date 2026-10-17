'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Users, QrCode, BarChart3, Download, Music, Image, MessageCircle } from 'lucide-react';
import { PRICE_PER_GUEST_USD, formatUsd, invitationTotalUsd } from '@/constants/pricing';

const EXAMPLES = [10, 50, 100, 200];

export default function PricingPage() {
  const router = useRouter();
  const [guests, setGuests] = useState(100);
  const total = useMemo(() => invitationTotalUsd(guests), [guests]);
  const unit = formatUsd(PRICE_PER_GUEST_USD);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans transition-colors">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-b border-rose-100 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
            ← Retour
          </button>
          <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">L&apos;offre</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        <div className="text-center mb-8">
          <p className="text-xs text-rose-500 font-medium uppercase tracking-wider mb-2">Invitia</p>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-3">
            {unit} <span className="text-gray-500 dark:text-gray-400 font-semibold text-xl">par invité</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            L&apos;offre gratuite partage 5 invités avec un vrai lien. Au-delà, chaque invité supplémentaire coûte {unit}.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-6">
          <p className="text-sm font-bold text-amber-950 dark:text-amber-100">Offre gratuite</p>
          <ul className="mt-2 space-y-1 text-xs text-amber-900 dark:text-amber-200">
            <li>5 invités, avec un lien que vous pouvez envoyer</li>
            <li>L&apos;invitation est enregistrée et s&apos;ouvre sur un autre téléphone</li>
            <li>Le 6e invité est bloqué tant que le supplément n&apos;est pas pris</li>
          </ul>
          <button
            type="button"
            onClick={() => router.push('/create/wedding')}
            className="mt-4 px-4 py-2 bg-amber-950 text-white rounded-xl text-xs font-semibold"
          >
            Créer le lien gratuit
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-rose-200 dark:border-rose-800 shadow-sm p-6 mb-6">
          <label htmlFor="guest-count" className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Nombre d&apos;invités
          </label>
          <input
            id="guest-count"
            type="number"
            min={0}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-rose-400"
          />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            5 invités offerts, puis {Math.max(0, guests - 5)} × {unit}
          </p>
          <p className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{formatUsd(total)}</p>
          <ul className="mt-6 space-y-2">
            {[
              'Invitation, RSVP et suivi inclus',
              'Photos, musique, QR code et exports',
              'Le total suit exactement la liste d\'invités',
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>
          <a
            href={`https://wa.me/243845370370?text=${encodeURIComponent(`Bonjour Invitia, je souhaite une invitation à ${unit} par invité.`)}`}
            target="_blank"
            rel="noopener"
            className="mt-6 block w-full py-3 bg-gradient-to-r from-rose-500 to-blue-500 text-white rounded-xl text-sm font-bold text-center"
          >
            Commander cette invitation
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {EXAMPLES.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setGuests(count)}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 text-left"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">{count} invités</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatUsd(invitationTotalUsd(count))}</p>
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Inclus pour chaque invité</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Users, title: 'Suivi des invités', desc: 'Statuts, groupes, recherche' },
              { icon: QrCode, title: 'QR code jour J', desc: 'Check-in à l\'entrée' },
              { icon: BarChart3, title: 'Réponses', desc: 'Confirmations et refus' },
              { icon: Download, title: 'Exports', desc: 'CSV et JSON' },
              { icon: MessageCircle, title: 'WhatsApp', desc: 'Lien personnel par invité' },
              { icon: Music, title: 'Ambiance', desc: 'Musique et photos' },
              { icon: Image, title: 'Galerie', desc: 'Photos de l\'invitation' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <f.icon className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{f.title}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: 'Comment est calculé le prix ?', a: `Les 5 premiers invités sont gratuits et le lien est partageable. Chaque personne au-delà coûte ${unit}.` },
              { q: 'Y a-t-il un abonnement ?', a: 'Non. L\'offre gratuite reste à 5 invités. Le supplément se paie une fois, par invité en plus.' },
              { q: 'Le lien gratuit fonctionne-t-il vraiment ?', a: 'Oui. L\'invitation est enregistrée. La personne qui reçoit le lien l\'ouvre sur son téléphone.' },
              { q: 'Que se passe-t-il au 6e invité ?', a: `L'ajout est bloqué. Pour continuer, chaque invité supplémentaire coûte ${unit}.` },
              { q: 'Comment payer ?', a: 'Pour l\'instant, par WhatsApp, Mobile Money ou virement. Le montant correspond au nombre d\'invités.' },
            ].map((faq) => (
              <div key={faq.q} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{faq.q}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
