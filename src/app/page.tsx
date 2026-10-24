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
import WhatsAppFloat, { WhatsAppGlyph } from '@/components/landing/WhatsAppFloat';
import { CONTACT_MESSAGE, TEAM_WHATSAPP_DISPLAY, TEAM_WHATSAPP_URL } from '@/constants/contact';

const packs = [50, 100, 200];

const supportSteps = [
  { title: 'Personnalisation', text: 'Posez vos questions sur les textes, les photos et les modèles d’invitation.' },
  { title: 'Forfaits', text: 'Choisissez le nombre d’invitations et confirmez le paiement avec notre équipe.' },
  { title: 'Partage', text: 'Retrouvez comment envoyer les liens personnels à vos invités sur WhatsApp.' },
  { title: 'Gestion des invités', text: 'Obtenez de l’aide pour les réponses, les tables et les cartes d’entrée.' },
];

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
            <a href="#contact" className="hidden sm:inline-flex px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:text-violet-700">
              Nous contacter
            </a>
            <ThemeToggle />
            {!loading && user ? (
              <Link href="/dashboard" className="px-4 py-2 text-xs font-semibold bg-violet-600 text-white rounded-xl">
                Mariages
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
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-500 mb-2">Invitations de mariage en ligne</p>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3">
              Créez votre invitation de mariage et gérez vos invités.
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Eventia vous permet de personnaliser votre invitation, de partager un lien personnel avec chaque invité et de suivre les réponses depuis votre tableau de bord. Préparez aussi les tables et les cartes d’entrée avec QR code pour le jour du mariage.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={user ? '/dashboard' : '/create/wedding'} className="inline-flex justify-center px-5 py-3 bg-violet-600 text-white rounded-2xl text-sm font-bold">
                Créer mon invitation
              </Link>
              <Link href="/pricing" className="inline-flex justify-center px-5 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-md hover:brightness-105 rounded-2xl text-sm font-bold">
                Choisir un forfait
              </Link>
              <Link href="/exemples" className="inline-flex justify-center px-5 py-3 bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md hover:brightness-105 rounded-2xl text-sm font-bold">
                Découvrir les invitations
              </Link>
            </div>
          </div>
          <StoryArt name="wedding" alt="Couple qui ouvre une invitation" className="w-full max-w-md mx-auto" />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">De la création à l’accueil des invités</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { art: 'photos' as const, title: 'Personnalisez votre invitation', text: 'Choisissez un modèle, ajoutez vos photos, vos textes, la date, les lieux et le programme. Vérifiez l’aperçu avant de publier.' },
              { art: 'customize' as const, title: 'Invitez et suivez les réponses', text: 'Ajoutez vos invités et partagez leurs liens personnels sur WhatsApp. Retrouvez les confirmations et les refus dans votre espace.' },
              { art: 'share' as const, title: 'Préparez le jour J', text: 'Attribuez les tables et utilisez les cartes d’entrée avec QR code pour vérifier les arrivées le jour du mariage.' },
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
          <h2 className="text-lg font-bold mb-2">Un forfait adapté à votre liste d’invités</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Commencez avec {TRIAL_INVITATIONS} invitations d’essai. Ajoutez ensuite des invitations à {formatUsd(PRICE_PER_GUEST_USD)} l’unité. Une invitation peut être destinée à une personne, un couple ou une famille.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {packs.map((count) => (
              <article key={count} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                <p className="text-sm font-bold">{count} invitations</p>
                <p className="text-2xl font-extrabold text-rose-500 my-1">{formatUsd(packTotalUsd(count))}</p>
                <p className="text-xs text-gray-500">+ {TRIAL_INVITATIONS} invitations d’essai</p>
              </article>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Besoin d’un autre nombre d’invitations ? Calculez votre forfait sur la page des tarifs, puis confirmez le paiement avec notre équipe sur WhatsApp.
          </p>
          <Link href="/pricing" className="inline-flex mt-3 px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl text-sm font-bold">Choisir un forfait</Link>
        </section>

        <section id="contact" className="mb-10 scroll-mt-20 overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-rose-50 p-6 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 md:p-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-500 mb-2">Nous contacter</p>
              <h2 className="text-2xl font-extrabold leading-tight mb-3">Besoin d’aide pour utiliser Eventia ?</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
                Contactez notre équipe sur WhatsApp pour une question sur votre invitation, la gestion des invités ou le choix d’un forfait.
              </p>
              <a
                href={`${TEAM_WHATSAPP_URL}?text=${encodeURIComponent(CONTACT_MESSAGE)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#128C7E] px-5 py-3 text-sm font-bold text-white shadow-md hover:brightness-105"
              >
                <WhatsAppGlyph className="h-5 w-5" />
                WhatsApp · {TEAM_WHATSAPP_DISPLAY}
              </a>
            </div>
            <ol className="space-y-3">
              {supportSteps.map((step, index) => (
                <li key={step.title} className="flex gap-3 rounded-2xl bg-white/80 p-3.5 ring-1 ring-violet-100 dark:bg-gray-800/70 dark:ring-gray-700">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">{index + 1}</span>
                  <div>
                    <p className="text-sm font-bold">{step.title}</p>
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <footer className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <StoryCredit />
          <p className="text-[11px] text-gray-400 mt-2">© {new Date().getFullYear()} Eventia</p>
        </footer>
      </main>
      <WhatsAppFloat />
    </div>
  );
}
