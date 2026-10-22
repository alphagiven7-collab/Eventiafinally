'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { ThemeToggle } from '@/providers/theme-toggle';
import { StoryArt, StoryCredit } from '@/components/brand/StoryArt';
import { formatUsd, packTotalUsd, PRICE_PER_GUEST_USD, TRIAL_INVITATIONS } from '@/constants/pricing';
import InstallApp from '@/components/pwa/InstallApp';
import { readGuestEntry } from '@/lib/pwa/install-prompt';

const packs = [50, 100, 200];

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const fromInstall = new URLSearchParams(window.location.search).get('source') === 'pwa';
    if (!standalone && !fromInstall) return;
    const entry = readGuestEntry();
    if (entry) {
      router.replace(entry);
      return;
    }
    if (loading) return;
    if (user) router.replace('/dashboard');
  }, [loading, user, router]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-rose-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="font-bold text-base">Eventia</Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!loading && user ? (
              <Link href="/dashboard" className="px-4 py-2 text-xs font-semibold bg-violet-600 text-white rounded-xl">
                Événements
              </Link>
            ) : (
              <Link href="/auth/login" className="px-4 py-2 text-xs font-semibold bg-violet-600 text-white rounded-xl">
                Connexion
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-16">
        <InstallApp />
        <section className="grid md:grid-cols-2 gap-6 items-center py-8 md:py-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-500 mb-2">Mariage ou fête</p>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3">
              Une invitation que les gens ont envie d’ouvrir.
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Écrivez le texte, ajoutez les photos, le jour et le lieu. Chaque invité reçoit son lien, dit s’il vient, et garde sa carte pour le jour de la fête. Vous commencez avec {TRIAL_INVITATIONS} invitations d’essai.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={user ? '/dashboard' : '/create/wedding'} className="inline-flex justify-center px-5 py-3 bg-violet-600 text-white rounded-2xl text-sm font-bold">
                Créer mon invitation
              </Link>
              <Link href="/e/yanick-keren" className="inline-flex justify-center px-5 py-3 border border-violet-200 dark:border-gray-700 rounded-2xl text-sm font-semibold">
                Voir un exemple
              </Link>
            </div>
          </div>
          <StoryArt name="wedding" alt="Couple qui ouvre une invitation" className="w-full max-w-md mx-auto" />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">Trois étapes</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { art: 'photos' as const, title: 'Mettez vos photos', text: 'Depuis votre téléphone ou votre ordinateur. Vous pouvez les changer.' },
              { art: 'customize' as const, title: 'Écrivez l’invitation', text: 'Les prénoms, le jour, le lieu, et le mot que vous voulez dire.' },
              { art: 'share' as const, title: 'Envoyez le lien', text: 'Chacun répond. S’il vient, sa carte d’entrée apparaît.' },
            ].map((step) => (
              <article key={step.title} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                <StoryArt name={step.art} alt="" className="w-full h-36 object-contain mb-3" />
                <h3 className="text-sm font-bold mb-1">{step.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-2">Les prix</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {formatUsd(PRICE_PER_GUEST_USD)} par invité. Les {TRIAL_INVITATIONS} invitations d’essai sont en plus : on ne les retire pas du forfait.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {packs.map((count) => (
              <article key={count} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                <p className="text-sm font-bold">{count} invités</p>
                <p className="text-2xl font-extrabold text-rose-500 my-1">{formatUsd(packTotalUsd(count))}</p>
                <p className="text-xs text-gray-500">Et {TRIAL_INVITATIONS} invitations d’essai en plus</p>
              </article>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Plus de 200 invités ? Le prix s’affiche avant de payer : {formatUsd(PRICE_PER_GUEST_USD)} fois le nombre choisi.
          </p>
          <Link href="/pricing" className="inline-block mt-3 text-sm font-semibold text-violet-700">Voir les prix</Link>
        </section>

        <footer className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <StoryCredit />
          <p className="text-[11px] text-gray-400 mt-2">© {new Date().getFullYear()} Eventia</p>
        </footer>
      </main>
    </div>
  );
}
