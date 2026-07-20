'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { PartyPopper, Sparkles, Heart, Camera } from 'lucide-react';
import { ThemeToggle } from '@/providers/theme-toggle';

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-gray-950 font-sans transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-lg font-semibold text-gray-900 dark:text-white">Invitia</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!loading && user ? (
              <Link href="/dashboard">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {(user.user_metadata?.name || 'U').charAt(0).toUpperCase()}
                </div>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-5 pt-16 pb-20 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-amber-100 dark:bg-amber-900/20 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-rose-100 dark:bg-rose-900/20 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="relative z-10 max-w-xl">
          {/* Emoji + Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-full border border-gray-200 dark:border-gray-700 shadow-sm mb-6 animate-fade-in">
            <span className="text-sm">💌</span>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">La plus belle façon d'inviter</span>
          </div>

          {/* Main headline */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 dark:text-white mb-5 leading-tight tracking-tight animate-reveal-up-slow">
            Vos invitations ne seront<br />
            <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-rose-400 bg-clip-text text-transparent">
              plus jamais les mêmes
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed animate-fade-in stagger-2">
            Offrez à vos invités une expérience inoubliable dès l'ouverture de votre lien.
            Une invitation qui fait dire <em>&ldquo;Wow&rdquo;</em> avant même de lire la date.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-3">
            <Link
              href="/create"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white rounded-2xl text-base font-semibold shadow-xl shadow-amber-200/50 dark:shadow-amber-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <PartyPopper className="w-5 h-5" />
              Créer mon invitation
            </Link>
            <Link
              href="/e/yanick-keren"
              className="w-full sm:w-auto px-6 py-4 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl text-sm font-medium hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-600 dark:hover:text-amber-400 transition flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Voir un exemple
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-gray-100 dark:border-gray-800 pt-8 animate-fade-in stagger-4">
            {[
              { value: '3 min', label: 'Pour créer' },
              { value: '2000+', label: 'Invitations envoyées' },
              { value: '100%', label: 'Mobile friendly' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-serif text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7"/>
          </svg>
        </div>
      </section>

      {/* Section: Comment ça marche */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-gray-900 dark:text-white mb-3">
            Simple comme un message WhatsApp
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Créez, partagez, et vos invités découvrent une expérience magnifique.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '📸',
              title: 'Ajoutez vos photos',
              desc: 'Importez directement depuis votre téléphone. Drag & drop. Aperçu immédiat.',
            },
            {
              icon: '✨',
              title: 'Personnalisez le style',
              desc: 'Chaque type d\'événement a sa propre identité visuelle. Mariage, anniversaire, baby shower.',
            },
            {
              icon: '💬',
              title: 'Partagez le lien',
              desc: 'Envoyez votre invitation par WhatsApp. Vos invités l\'ouvrent et découvrent la magie.',
            },
          ].map((step, i) => (
            <div
              key={i}
              className="relative p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all"
            >
              <div className="text-4xl mb-4">{step.icon}</div>
              <h3 className="font-serif text-lg font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Types d'événements */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-gray-900 dark:text-white mb-3">
            Chaque événement a son âme
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Une identité visuelle unique pour chaque occasion. Mariage, anniversaire, baby shower...
            Chaque invitation raconte une histoire différente.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { emoji: '💍', name: 'Mariage', color: 'from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20' },
            { emoji: '🎂', name: 'Anniversaire', color: 'from-pink-100 to-rose-50 dark:from-pink-900/30 dark:to-rose-800/20' },
            { emoji: '👶', name: 'Baby Shower', color: 'from-blue-100 to-sky-50 dark:from-blue-900/30 dark:to-sky-800/20' },
            { emoji: '🎓', name: 'Diplôme', color: 'from-navy-100 to-slate-50 dark:from-navy-900/30 dark:to-slate-800/20' },
            { emoji: '💼', name: 'Corporate', color: 'from-gray-100 to-slate-50 dark:from-gray-900/30 dark:to-slate-800/20' },
          ].map((cat) => (
            <Link
              key={cat.name}
              href={`/create/${cat.name.toLowerCase()}`}
              className={`flex flex-col items-center gap-2 p-5 bg-gradient-to-br ${cat.color} rounded-2xl border border-gray-100 dark:border-gray-800 hover:scale-105 transition-all duration-300 shadow-sm`}
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Section: Photos-first */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-center overflow-hidden relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 bg-amber-400 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-rose-400 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <Camera className="w-12 h-12 text-amber-400 mx-auto mb-5" />
            <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
              Les photos d'abord
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-8 leading-relaxed">
              Une invitation n'est plus un simple texte. C'est une expérience visuelle.
              L'œil regarde les photos avant de lire la date.
              Effet Ken Burns, zooms élégants, galeries immersives.
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-gray-900 rounded-2xl text-base font-bold transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5" />
              Je crée la mienne
            </Link>
          </div>
        </div>
      </section>

      {/* Section: Testimonials */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-gray-900 dark:text-white mb-3">
            Ce qu'ils disent
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "Mes invités m'ont tous dit : « C'est la plus belle invitation que j'ai jamais reçue ! »",
              author: 'Marie K.',
              event: 'Mariage',
            },
            {
              quote: "J'ai créé l'invitation d'anniversaire de ma fille en 3 minutes sur mon téléphone. Incroyablement simple.",
              author: 'David M.',
              event: 'Anniversaire',
            },
            {
              quote: "L'effet waouh est garanti. Mes collègues n'en revenaient pas de la qualité.",
              author: 'Sarah T.',
              event: 'Corporate',
            },
          ].map((testimonial, i) => (
            <div
              key={i}
              className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm"
            >
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 italic">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{testimonial.author}</p>
                <p className="text-xs text-gray-400">{testimonial.event}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-5 py-16 pb-24">
        <div className="text-center">
          <h2 className="font-serif text-3xl md:text-5xl font-light text-gray-900 dark:text-white mb-4">
            Prêt à créer la plus belle<br />
            invitation de votre vie&nbsp;?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            C'est gratuit. Ça prend 3 minutes. L'effet waouh est garanti.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white rounded-2xl text-lg font-bold shadow-xl shadow-amber-200/50 dark:shadow-amber-900/30 transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-5 h-5" />
            Créer mon invitation gratuite
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">© {new Date().getFullYear()} Invitia</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/e/yanick-keren" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
              Exemple mariage
            </Link>
            <Link href="/auth/login" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
              Connexion
            </Link>
            <Link href="/auth/register" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
              S'inscrire
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}