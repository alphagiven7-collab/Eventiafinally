'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { ThemeToggle } from '@/providers/theme-toggle';
import {
  Sparkles, Send, Camera, Palette, Users, Heart,
  ChevronRight, Star, Shield, Zap, Gift
} from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans transition-colors">
      {/* Header — type app */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border-b border-rose-100 dark:border-gray-800">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Logo Invitia — enveloppe cœur */}
            <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36">
                  <stop offset="0%" stopColor="#f472b6"/>
                  <stop offset="100%" stopColor="#3b82f6"/>
                </linearGradient>
              </defs>
              <rect width="36" height="36" rx="10" fill="url(#logoGrad)"/>
              <path d="M10 16.5l8-5 8 5v7a2 2 0 01-2 2H12a2 2 0 01-2-2v-7z" fill="white" opacity="0.9"/>
              <path d="M18 16l-2 7h4l-2-7z" fill="url(#logoGrad)" opacity="0.8"/>
              <circle cx="14" cy="20" r="1.5" fill="white"/>
              <circle cx="22" cy="20" r="1.5" fill="white"/>
              <path d="M17.5 21.5a1.5 1.5 0 001.5 1.5 1.5 1.5 0 001.5-1.5" stroke="white" strokeWidth="0.8" fill="none"/>
            </svg>
            <span className="font-bold text-base text-gray-900 dark:text-white">Invitia</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!loading && user ? (
              <Link href="/dashboard" className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                {(user.user_metadata?.name || 'U').charAt(0).toUpperCase()}
              </Link>
            ) : (
              <Link href="/auth/login" className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-rose-500 to-blue-500 text-white rounded-xl shadow-md shadow-rose-200 dark:shadow-rose-900/30 hover:shadow-lg transition-all active:scale-95">
                Connexion
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pb-24">
        {/* Hero — avec fond décoratif */}
        <section className="pt-10 pb-8 text-center relative overflow-hidden">
          {/* Formes décoratives de fond */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-200 dark:bg-rose-900/20 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full blur-3xl opacity-40" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-violet-200 dark:bg-violet-900/20 rounded-full blur-3xl opacity-30" />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-rose-100 dark:border-gray-700 shadow-sm mb-6">
            <Zap className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Creer en 3 minutes</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight">
            La plus belle facon<br />
            <span className="bg-gradient-to-r from-rose-500 to-blue-500 bg-clip-text text-transparent">
              d'inviter vos proches
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
            Creez des invitations elegantes en quelques clics. Partagez par WhatsApp. Vos invites decouvrent une experience inoubliable.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/create"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-rose-500 to-blue-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-rose-200 dark:shadow-rose-900/30 hover:shadow-2xl transition-all active:scale-95">
              <Send className="w-4 h-4" />
              Creer mon invitation
            </Link>
            <Link href="/e/yanick-keren"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-rose-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-semibold text-sm hover:border-rose-400 dark:hover:border-rose-700 transition-all active:scale-95">
              <Heart className="w-4 h-4 text-rose-500" />
              Voir un exemple
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { value: '3 min', label: 'Creation' },
              { value: '2000+', label: 'Envoyees' },
              { value: '100%', label: 'Mobile' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl font-extrabold bg-gradient-to-r from-rose-500 to-blue-500 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comment ca marche — avec photo de fond */}
        <section className="mb-8 relative">
          {/* Background photo decorative */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-[0.06] dark:opacity-[0.08]">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-blue-500 to-violet-500" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,white_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>
          <div className="relative">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">Comment ca marche</h2>
            <div className="space-y-3">
              {[
                { icon: Camera, color: 'from-rose-400 to-rose-500', title: 'Ajoutez vos photos', desc: 'Importez depuis votre telephone. Drag & drop. Apercu immediat.' },
                { icon: Palette, color: 'from-blue-400 to-blue-500', title: 'Personnalisez le style', desc: 'Chaque evenement a sa propre identite visuelle.' },
                { icon: Send, color: 'from-violet-400 to-violet-500', title: 'Partagez le lien', desc: 'Envoyez par WhatsApp. Vos invites decouvrent la magie.' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">{step.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section visuelle — photo atmosphere */}
        <div className="mb-8 relative h-44 rounded-3xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-400 via-pink-400 to-blue-400">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_white_1px,_transparent_1px)] bg-[size:30px_30px] opacity-30" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_white_2px,_transparent_2px)] bg-[size:60px_60px] opacity-20" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <p className="text-white/90 text-lg md:text-xl font-bold mb-1">✨ Chaque invitation raconte une histoire</p>
            <p className="text-white/70 text-xs">Mariage · Anniversaire · Baby Shower · Fiancailles · Diplome</p>
          </div>
        </div>

        {/* Types d'evenements */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">Choisissez votre evenement</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: '💍', label: 'Mariage', slug: 'wedding', gradient: 'from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-800/20' },
              { emoji: '💕', label: 'Fiancailles', slug: 'engagement', gradient: 'from-pink-100 to-pink-50 dark:from-pink-900/30 dark:to-pink-800/20' },
              { emoji: '🎂', label: 'Anniversaire', slug: 'birthday', gradient: 'from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20' },
              { emoji: '👶', label: 'Baby Shower', slug: 'baby-shower', gradient: 'from-blue-100 to-sky-50 dark:from-blue-900/30 dark:to-sky-800/20' },
              { emoji: '🙏', label: 'Religieux', slug: 'religious', gradient: 'from-cream-100 to-cream-50 dark:from-cream-900/30 dark:to-cream-800/20' },
              { emoji: '🎓', label: 'Diplome', slug: 'graduation', gradient: 'from-navy-100 to-slate-50 dark:from-navy-900/30 dark:to-slate-800/20' },
              { emoji: '💼', label: 'Corporate', slug: 'corporate', gradient: 'from-gray-100 to-slate-50 dark:from-gray-900/30 dark:to-slate-800/20' },
            ].map((cat) => (
              <Link key={cat.slug}
                href={`/create/${cat.slug}`}
                className={`flex items-center gap-3 p-4 bg-gradient-to-br ${cat.gradient} rounded-2xl border border-gray-100 dark:border-gray-800 hover:scale-105 transition-all shadow-sm active:scale-95`}>
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{cat.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
              </Link>
            ))}
          </div>
        </section>

        {/* Decorative separator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-rose-300 to-rose-300 dark:via-rose-700" />
          <svg className="w-6 h-6" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="url(#logoGrad)"/>
            <path d="M10 16.5l8-5 8 5v7a2 2 0 01-2 2H12a2 2 0 01-2-2v-7z" fill="white" opacity="0.9"/>
          </svg>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-blue-300 to-blue-300 dark:via-blue-700" />
        </div>

        {/* Pourquoi Invitia */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">Pourquoi Invitia ?</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Shield, label: 'Gratuit', desc: 'Sans carte bancaire' },
              { icon: Zap, label: '3 minutes', desc: 'Creation express' },
              { icon: Heart, label: 'Effet waouh', desc: 'Design premium' },
              { icon: Users, label: 'WhatsApp', desc: 'Partage facile' },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 text-center shadow-sm">
                <item.icon className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section visuelle — invitation example preview */}
        <div className="mb-8 relative h-40 rounded-3xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-violet-400 to-rose-400">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_2px,_transparent_2px)] bg-[size:50px_50px] opacity-25" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-center p-6">
            <div>
              <p className="text-white text-lg font-extrabold mb-1">📱 Ouvert depuis WhatsApp</p>
              <p className="text-white/70 text-xs">Vos invites recoivent un lien. Ils l'ouvrent. L'effet waouh est immediat.</p>
            </div>
          </div>
        </div>

        {/* Temoignages */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">Ils ont adore</h2>
          <div className="space-y-3">
            {[
              { quote: "Mes invites m'ont tous dit : c'est la plus belle invitation que j'ai jamais recue !", author: 'Marie K.', event: 'Mariage', avatar: 'MK' },
              { quote: "J'ai cree l'invitation d'anniversaire de ma fille en 3 minutes sur mon telephone.", author: 'David M.', event: 'Anniversaire', avatar: 'DM' },
            ].map((t, i) => (
              <div key={i} className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{t.avatar}</div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(5)].map((_, s) => (<Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />))}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                    <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 mt-1.5">{t.author} · <span className="text-gray-400">{t.event}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Decorative photo strip before CTA */}
        <div className="mb-6 flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {['💍', '💕', '🎂', '👶', '🙏', '🎓', '💼'].map((emoji, i) => (
            <div key={i}
              className="flex-shrink-0 w-20 h-24 rounded-2xl bg-gradient-to-br from-rose-200 via-white to-blue-200 dark:from-rose-900/30 dark:via-gray-800 dark:to-blue-900/30 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-3xl shadow-sm">
              {emoji}
            </div>
          ))}
        </div>

        {/* CTA Final */}
        <section className="text-center mb-4">
          <div className="p-6 bg-gradient-to-br from-rose-500 to-blue-600 rounded-3xl shadow-xl shadow-rose-200 dark:shadow-rose-900/30">
            <Gift className="w-8 h-8 text-white mx-auto mb-3" />
            <h3 className="text-lg font-extrabold text-white mb-2">Pret a creer la plus belle invitation ?</h3>
            <p className="text-xs text-white/80 mb-5">C'est gratuit. Ca prend 3 minutes. L'effet waouh est garanti.</p>
            <Link href="/create"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 rounded-2xl font-bold text-sm hover:shadow-2xl transition-all active:scale-95">
              <Sparkles className="w-4 h-4 text-rose-500" />
              Creer mon invitation gratuite
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-4 pb-2">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} Invitia — Fait avec ❤️ en RDC
          </p>
        </footer>
      </main>

      {/* Bottom navigation — style app mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-around">
          {[
            { icon: 'home', label: 'Accueil', active: true, href: '/' },
            { icon: 'search', label: 'Explorer', active: false, href: '/dashboard' },
            { icon: 'plus', label: 'Creer', active: false, href: '/create' },
            { icon: 'heart', label: 'Favoris', active: false, href: '/e/yanick-keren' },
            { icon: 'user', label: 'Profil', active: false, href: '/dashboard' },
          ].map((tab, i) => (
            <Link key={i} href={tab.href} className="flex flex-col items-center gap-0.5 px-3 py-1">
              {tab.icon === 'home' && (
                <svg className={`w-5 h-5 ${tab.active ? 'text-rose-500' : 'text-gray-400'}`} viewBox="0 0 24 24" fill={tab.active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              )}
              {tab.icon === 'search' && (
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              )}
              {tab.icon === 'plus' && (
                <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-blue-500 rounded-full flex items-center justify-center -mt-3 shadow-lg shadow-rose-200 dark:shadow-rose-900/30">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
              )}
              {tab.icon === 'heart' && (
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              )}
              {tab.icon === 'user' && (
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              )}
              <span className={`text-[10px] font-medium ${tab.active ? 'text-rose-500' : 'text-gray-400'}`}>{tab.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}