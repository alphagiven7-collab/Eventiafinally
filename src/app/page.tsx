'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { ThemeToggle } from '@/providers/theme-toggle';
import { StoryArt, StoryCredit } from '@/components/brand/StoryArt';
import { formatUsd, packTotalUsd, PRICE_PER_GUEST_USD, TRIAL_INVITATIONS } from '@/constants/pricing';
import InstallApp from '@/components/pwa/InstallApp';

const packs = [50, 100, 200];

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const fromInstall = new URLSearchParams(window.location.search).get('source') === 'pwa';
    if (standalone || fromInstall) router.replace('/dashboard');
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
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-500 mb-2">Invitations en ligne</p>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3">
              Créez l’invitation, envoyez le lien, suivez les réponses.
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Eventia sert à préparer un mariage ou une fête : texte, photos, date, lieu, liste d’invités et confirmation de présence. Vous commencez gratuitement avec {TRIAL_INVITATIONS} invitations d’essai.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={user ? '/dashboard' : '/create'} className="inline-flex justify-center px-5 py-3 bg-violet-600 text-white rounded-2xl text-sm font-bold">
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
          <h2 className="text-lg font-bold mb-4">Comment ça se passe</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { art: 'photos' as const, title: 'Ajoutez vos photos', text: 'Depuis le téléphone ou l’ordinateur. Vous pouvez les remplacer ou les retirer.' },
              { art: 'customize' as const, title: 'Personnalisez', text: 'Noms, date, lieu, texte et modèle. Enregistrez le brouillon avant de publier.' },
              { art: 'share' as const, title: 'Envoyez le lien', text: 'Chaque invité reçoit son lien. Il confirme, laisse un message, et obtient sa carte d’entrée.' },
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
          <h2 className="text-lg font-bold mb-2">Les offres</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Le prix est {formatUsd(PRICE_PER_GUEST_USD)} par invité. Les {TRIAL_INVITATIONS} invitations d’essai s’ajoutent au forfait, elles ne sont pas déduites.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {packs.map((count) => (
              <article key={count} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                <p className="text-sm font-bold">{count} invités</p>
                <p className="text-2xl font-extrabold text-rose-500 my-1">{formatUsd(packTotalUsd(count))}</p>
                <p className="text-xs text-gray-500">Plus {TRIAL_INVITATIONS} invitations d’essai</p>
              </article>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Au-delà de 200 invités, le total est {formatUsd(PRICE_PER_GUEST_USD)} multiplié par le nombre choisi. Il s’affiche avant validation.
          </p>
          <Link href="/pricing" className="inline-block mt-3 text-sm font-semibold text-violet-700">Voir le détail des offres</Link>
        </section>

        <footer className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <StoryCredit />
          <p className="text-[11px] text-gray-400 mt-2">© {new Date().getFullYear()} Eventia</p>
        </footer>
      </main>
    </div>
  );
}
