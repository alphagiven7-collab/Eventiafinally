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
    <div className="min-h-screen font-sans transition-colors relative">
      {/* Image de fond globale subtile */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80"
          alt=""
          className="w-full h-full object-cover opacity-[0.08] dark:opacity-[0.05]"
          loading="lazy"
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border-b border-rose-100 dark:border-gray-800">
          <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
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
          {/* Hero avec photo de fond */}
          <section className="pt-10 pb-8 text-center relative overflow-hidden rounded-b-[3rem] mb-4">
            <div className="absolute inset-0 z-0">
              <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80" alt="" className="w-full h-full object-cover opacity-40 dark:opacity-25" loading="eager" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/30 to-white/70 dark:from-gray-950/70 dark:via-gray-950/30 dark:to-gray-950/70" />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-rose-100 dark:border-gray-700 shadow-sm mb-6">
                <Zap className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">La premiere emotion de votre evenement</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight">
                Avant le jour J,<br />
                <span className="bg-gradient-to-r from-rose-500 to-blue-500 bg-clip-text text-transparent">il y a l'invitation</span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
                Parce qu'un evenement commence bien avant la date. Offrez a vos invites un moment unique des l'ouverture du lien.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/create" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-rose-500 to-blue-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-rose-200 dark:shadow-rose-900/30 hover:shadow-2xl transition-all active:scale-95">
                  <Send className="w-4 h-4" /> Essayer gratuitement
                </Link>
                <Link href="/e/yanick-keren" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-rose-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-semibold text-sm hover:border-rose-400 dark:hover:border-rose-700 transition-all active:scale-95">
                  <Heart className="w-4 h-4 text-rose-500" /> Decouvrir un exemple
                </Link>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-4">
                {[{ value: '3 min', label: 'Pour creer' },{ value: '2000+', label: 'Invitations envoyees' },{ value: '100%', label: 'Souvenirs' }].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-xl font-extrabold bg-gradient-to-r from-rose-500 to-blue-500 bg-clip-text text-transparent">{stat.value}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Comment ca marche */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">Tout commence par une photo</h2>
            <div className="space-y-3">
              {[
                { icon: Camera, color: 'from-rose-400 to-rose-500', title: 'Vos photos prennent vie', desc: "Importez-les depuis votre telephone. Elles deviennent le coeur de l'invitation." },
                { icon: Palette, color: 'from-blue-400 to-blue-500', title: 'Votre histoire, votre style', desc: 'Chaque evenement a son ambiance. Mariage, anniversaire, conference ou diplome.' },
                { icon: Send, color: 'from-violet-400 to-violet-500', title: 'Un lien, une emotion', desc: "Partagez par WhatsApp. Vos invites recoivent bien plus qu'une simple invitation." },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
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
          </section>

          {/* Photo ambiance mariage */}
          <div className="mb-8 relative h-52 rounded-3xl overflow-hidden shadow-xl">
            <img src="https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80" alt="Mariage" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-pink-400/15 to-blue-500/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <p className="text-white/90 text-lg md:text-xl font-bold mb-1">✨ Vos plus beaux souvenirs meritent la plus belle invitation</p>
              <p className="text-white/70 text-xs">Chaque photo raconte une histoire. Chaque histoire merite d'etre partagee.</p>
            </div>
          </div>

          {/* Types d'evenements */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">Votre evenement, votre univers</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: '💍', label: 'Mariage', slug: 'wedding', gradient: 'from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-800/20' },
                { emoji: '🎂', label: 'Anniversaire', slug: 'birthday', gradient: 'from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20' },
                { emoji: '🎤', label: 'Conference', slug: 'corporate', gradient: 'from-gray-100 to-slate-50 dark:from-gray-900/30 dark:to-slate-800/20' },
                { emoji: '🎓', label: 'Diplome', slug: 'graduation', gradient: 'from-navy-100 to-slate-50 dark:from-navy-900/30 dark:to-slate-800/20' },
              ].map((cat) => (
                <Link key={cat.slug} href={`/create/${cat.slug}`} className={`flex items-center gap-3 p-4 bg-gradient-to-br ${cat.gradient} rounded-2xl border border-gray-100 dark:border-gray-800 hover:scale-105 transition-all shadow-sm active:scale-95`}>
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{cat.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                </Link>
              ))}
            </div>
          </section>

          {/* Separator */}
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
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">Ce qui fait la difference</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Shield, label: 'Gratuit', desc: 'Sans carte, sans pub' },
                { icon: Zap, label: '3 minutes', desc: "Le temps d'un cafe" },
                { icon: Heart, label: 'Emotion', desc: 'Pas juste un carton' },
                { icon: Users, label: 'WhatsApp', desc: 'La ou sont vos invites' },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 text-center shadow-sm">
                  <item.icon className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Bloc WhatsApp avec logo */}
          <div className="mb-8 relative h-44 rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-emerald-500 to-green-600">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <svg className="w-40 h-40" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-6 gap-5">
              <svg className="w-14 h-14 flex-shrink-0" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <div className="text-left">
                <p className="text-white text-lg font-extrabold mb-0.5">Ouvert sur WhatsApp</p>
                <p className="text-white/80 text-xs">Un lien recu. Un clic. Et l'emotion commence. Aussi simple que ca.</p>
              </div>
            </div>
          </div>

          {/* Temoignages */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">Ce qu'ils en disent</h2>
            <div className="space-y-3">
              {[
                { quote: "Je voulais que mes invites ressentent quelque chose avant meme d'arriver. C'est exactement ce qui s'est passe.", author: 'Marie K.', event: 'Mariage', avatar: 'MK' },
                { quote: "J'ai cree l'invitation d'anniversaire de ma fille sur mon telephone. Elle m'a dit : Maman, c'est la plus belle chose que j'ai vue.", author: 'David M.', event: 'Anniversaire', avatar: 'DM' },
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

          {/* Photo strip emojis */}
          <div className="mb-6 flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {['💍', '💕', '🎂', '👶', '🙏', '🎓', '💼'].map((emoji, i) => (
              <div key={i} className="flex-shrink-0 w-20 h-24 rounded-2xl bg-gradient-to-br from-rose-200 via-white to-blue-200 dark:from-rose-900/30 dark:via-gray-800 dark:to-blue-900/30 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-3xl shadow-sm">{emoji}</div>
            ))}
          </div>

          {/* CTA Final */}
          <section className="text-center mb-4">
            <div className="p-6 bg-gradient-to-br from-rose-500 to-blue-600 rounded-3xl shadow-xl shadow-rose-200 dark:shadow-rose-900/30">
              <Gift className="w-8 h-8 text-white mx-auto mb-3" />
              <h3 className="text-lg font-extrabold text-white mb-2">Votre evenement merite la plus belle des invitations</h3>
              <p className="text-xs text-white/80 mb-5">Gratuit. 3 minutes. Aucune carte bancaire demandee.</p>
              <Link href="/create" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 rounded-2xl font-bold text-sm hover:shadow-2xl transition-all active:scale-95">
                <Sparkles className="w-4 h-4 text-rose-500" /> Commencer mon invitation
              </Link>
            </div>
          </section>

          <footer className="text-center pt-4 pb-2">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">© {new Date().getFullYear()} Invitia — Chaque invitation est un souvenir qui commence</p>
          </footer>
        </main>

        {/* Bottom navigation */}
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
                {tab.icon === 'home' && (<svg className={`w-5 h-5 ${tab.active ? 'text-rose-500' : 'text-gray-400'}`} viewBox="0 0 24 24" fill={tab.active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>)}
                {tab.icon === 'search' && (<svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>)}
                {tab.icon === 'plus' && (<div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-blue-500 rounded-full flex items-center justify-center -mt-3 shadow-lg shadow-rose-200 dark:shadow-rose-900/30"><svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>)}
                {tab.icon === 'heart' && (<svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>)}
                {tab.icon === 'user' && (<svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>)}
                <span className={`text-[10px] font-medium ${tab.active ? 'text-rose-500' : 'text-gray-400'}`}>{tab.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}