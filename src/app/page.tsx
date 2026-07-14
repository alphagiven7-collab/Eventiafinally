'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { useAuth } from '@/components/auth/SupabaseProvider';
import { 
  Sparkles, ArrowRight, CheckCircle, Heart, PartyPopper, 
  Users, MessageCircle, Star, Play, ChevronRight, 
  Palette, ImageIcon, Music, Shield, Clock, MapPin,
  Bell, Share2, Calendar, Camera, Smile, Gift,
  AlertCircle, Search, XCircle, Phone, Clock3
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Status Bar (iOS style) */}
      <div className="h-10 bg-green-900 flex items-center justify-between px-6 text-white text-[11px] font-semibold">
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
        </div>
      </div>

      {/* App Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Invitia</h1>
              <p className="text-[10px] text-gray-500 -mt-0.5">Finies les invitations galères</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {loading ? null : user ? (
              /* Connecté → lien vers dashboard */
              <Link href="/dashboard">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer hover:opacity-80">
                  {(user.user_metadata?.name || 'U').charAt(0).toUpperCase()}
                </div>
              </Link>
            ) : (
              /* Pas connecté → boutons clairs Connexion / Inscription */
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <button className="px-4 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    Connexion
                  </button>
                </Link>
                <Link href="/auth/register">
                  <button className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                    S'inscrire
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto pb-20">
        {/* Hero Section - Problem Focused */}
        <section className="relative mx-4 mt-4 rounded-3xl overflow-hidden shadow-lg">
          <div className="relative h-72">
            <Image 
              src="https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80"
              alt="Événement"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            
            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-medium mb-3 border border-white/20">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span>+2 000 organisateurs nous ont choisis</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1 leading-tight">
                Tu stresses pour ton<br />
                <span className="text-emerald-300">événement ?</span>
              </h2>
              <p className="text-xs text-white/80 mb-4 leading-relaxed">
                On a créé Invitia pour toi. Plus besoin de courir après les invités,<br />
                de payer un designer ou de perdre des heures à organiser.
              </p>
              <div className="flex gap-2">
                <Link href="/create" className="flex-1">
                  <button className="w-full bg-white text-gray-900 text-sm font-semibold py-2.5 rounded-xl shadow-lg hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Créer mon invitation gratuite
                  </button>
                </Link>
                {/* Demo link to test invitation */}
                <Link href="/e/yanick-keren" className="flex-1">
                  <button className="w-full bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-xl shadow-lg hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    Voir une démo
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The Real Problem - Before/After */}
        <section className="mx-4 mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 text-center mb-4">
              Le vrai problème des invitations en RDC
            </h3>
            
            <div className="space-y-3">
              {/* Problem 1 */}
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-800">Tu passes des heures à designer</p>
                  <p className="text-[10px] text-red-600">Canva, Photoshop, demander à un ami graphiste… tu perds 3 jours pour une invitation.</p>
                </div>
              </div>
              
              {/* Problem 2 */}
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-800">Envoyer sur WhatsApp est un calvaire</p>
                  <p className="text-[10px] text-red-600">Ajouter chaque contact un par un, pas de suivi, oublis… tes invités ne reçoivent rien.</p>
                </div>
              </div>
              
              {/* Problem 3 */}
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Search className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-800">Tu ne sais jamais qui vient</p>
                  <p className="text-[10px] text-red-600">Les gens disent « je viens » puis changent d'avis. Tu finis par payer pour des absents.</p>
                </div>
              </div>
            </div>

            {/* Solution */}
            <div className="mt-4 p-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <PartyPopper className="w-5 h-5 text-white" />
                <h4 className="text-sm font-bold text-white">Invitia résout tout ça</h4>
              </div>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-[11px] text-white/90">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-200 flex-shrink-0" />
                  <span>Crée une invitation pro en 3 minutes</span>
                </li>
                <li className="flex items-center gap-2 text-[11px] text-white/90">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-200 flex-shrink-0" />
                  <span>Partage un lien WhatsApp unique — tes invités cliquent, c'est fini</span>
                </li>
                <li className="flex items-center gap-2 text-[11px] text-white/90">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-200 flex-shrink-0" />
                  <span>RSVP automatique : tu vois exactement qui vient en temps réel</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Quick Stats - Social Proof */}
        <section className="mx-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-[10px] text-gray-500 text-center mb-3">Ils nous font confiance pour leur événement</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: '2K+', label: 'Événements', desc: 'créés' },
                { value: '15K+', label: 'Invités', desc: 'atteints' },
                { value: '4.9', label: 'Note', desc: 'moyenne' },
                { value: '98%', label: 'Satisf.', desc: 'recommandent' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-lg font-bold text-emerald-600">{stat.value}</div>
                  <div className="text-[9px] text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works - Simple 3 Steps */}
        <section className="mx-4 mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 text-center mb-4">
              Comment ça marche ?
            </h3>
            
            <div className="space-y-4">
              {[
                { step: '1', emoji: '✏️', title: 'Tu crées en 3 min', desc: 'Choisis ton type d\'événement, remplis les infos, sélectionne un template qui déchire.' },
                { step: '2', emoji: '📤', title: 'Tu partages en 1 clic', desc: 'Un lien WhatsApp unique. Tes invités cliquent, ils ont tout : date, lieu, carte GPS.' },
                { step: '3', emoji: '✅', title: 'Tu sais qui vient', desc: 'RSVP automatique. Plus d\'appels pour relancer les gens. Tu vois tout en temps réel.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm font-bold text-emerald-700">
                      {item.step}
                    </div>
                    {i < 2 && <div className="w-0.5 h-8 bg-emerald-200 mt-1" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-gray-900">{item.emoji} {item.title}</h4>
                    <p className="text-[10px] text-gray-600 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories / Event Types */}
        <section className="mx-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Organise quoi ?</h3>
            <button className="text-xs text-emerald-600 font-medium">Tout voir</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
            {[
              { image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&q=80', name: 'Mariage', desc: 'Le grand jour', color: 'from-rose-500 to-rose-600' },
              { image: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=200&q=80', name: 'Anniversaire', desc: 'Fête tes ans', color: 'from-amber-500 to-amber-600' },
              { image: 'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=200&q=80', name: 'Baby Shower', desc: 'Bébé arrive', color: 'from-blue-500 to-blue-600' },
              { image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&q=80', name: 'Diplôme', desc: 'Félicitations', color: 'from-purple-500 to-purple-600' },
              { image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=200&q=80', name: 'Corporate', desc: 'Événement pro', color: 'from-gray-500 to-gray-600' },
            ].map((cat, i) => (
              <button key={i} className="flex-shrink-0 flex flex-col items-center gap-2 snap-start">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-sm ring-2 ring-white">
                  <Image 
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-20`} />
                </div>
                <span className="text-[11px] font-medium text-gray-700">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Features - Why Invitia */}
        <section className="mx-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Pourquoi Invitia ?</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Clock, title: '3 minutes chrono', desc: 'Pas de designer, pas de galère', color: 'from-emerald-400 to-emerald-500' },
              { icon: MessageCircle, title: 'WhatsApp 1 clic', desc: 'Tes invités cliquent et c\'est fait', color: 'from-green-400 to-green-500' },
              { icon: Users, title: 'RSVP automatique', desc: 'Plus d\'appels pour relancer', color: 'from-teal-400 to-teal-500' },
              { icon: Shield, title: '100% gratuit', desc: 'Pas de carte bancaire', color: 'from-cyan-400 to-cyan-500' },
            ].map((feat, i) => (
              <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                <div className={`w-10 h-10 bg-gradient-to-br ${feat.color} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                  <feat.icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-0.5">{feat.title}</h4>
                <p className="text-[11px] text-gray-500">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Templates - Horizontal Scroll with Real Images */}
        <section className="mt-6">
          <div className="mx-4 flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Modèles qui cartonnent</h3>
            <Link href="/create" className="text-xs text-emerald-600 font-medium">Tout voir</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
            {[
              { image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80', title: 'Romantique', type: 'Mariage', tag: '💍', color: 'rose' },
              { image: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400&q=80', title: 'Festif', type: 'Anniversaire', tag: '🎂', color: 'amber' },
              { image: 'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=400&q=80', title: 'Doux', type: 'Baby Shower', tag: '👶', color: 'blue' },
              { image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80', title: 'Élégant', type: 'Diplôme', tag: '🎓', color: 'purple' },
            ].map((tmpl, i) => (
              <div key={i} className="flex-shrink-0 w-44 snap-center">
                <div className="relative h-52 rounded-2xl overflow-hidden shadow-md">
                  <Image 
                    src={tmpl.image}
                    alt={tmpl.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-medium border border-white/20">
                      {tmpl.tag} {tmpl.type}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h4 className="text-sm font-bold text-white">{tmpl.title}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex -space-x-1">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className="w-4 h-4 rounded-full bg-white/30 border border-white/50" />
                        ))}
                      </div>
                      <span className="text-[10px] text-white/70">+24 utilisations</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials - Real Stories */}
        <section className="mx-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Ils s'en sont sortis grâce à Invitia</h3>
          </div>
          <div className="space-y-3">
            {[
              { 
                name: 'Grace M.', 
                city: 'Kolwezi', 
                text: 'J\'étais à 3 semaines du mariage de ma fille, je ne dormais plus. Avec Invitia j\'ai tout réglé en 2 jours. Le lien WhatsApp, le RSVP... mes invités ont adoré !', 
                initial: 'G',
                problem: 'Mariage dans 3 semaines, zéro organisation'
              },
              { 
                name: 'Jean-Pierre K.', 
                city: 'Lubumbashi', 
                text: 'Pour mes 30 ans, je voulais inviter 80 personnes. Sans Invitia, j\'aurais dû appeler tout le monde un par un. Le suivi RSVP m\'a évité de payer des repas pour rien.', 
                initial: 'J',
                problem: '80 invités à gérer, stress du suivi'
              },
            ].map((t, i) => (
              <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {t.problem}
                  </span>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-gray-700 mb-3 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {t.initial}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">{t.name}</div>
                    <div className="text-[10px] text-gray-500">{t.city}, RDC</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Urgency / Why Now */}
        <section className="mx-4 mt-6">
          <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Clock3 className="w-5 h-5 text-white" />
              <h4 className="text-sm font-bold text-white">Pourquoi commencer maintenant ?</h4>
            </div>
            <p className="text-[11px] text-white/80 mb-3">
              Plus tu attends, plus tu stresses. Une invitation Invitia se crée en 3 minutes.
              <strong className="text-white"> Demain il sera trop tard pour être tranquille.</strong>
            </p>
            <Link href="/create">
              <button className="w-full bg-white text-amber-700 text-sm font-bold py-2.5 rounded-xl shadow-md hover:bg-amber-50 transition-all active:scale-[0.98]">
                Je crée mon invitation maintenant
              </button>
            </Link>
          </div>
        </section>

        {/* Pricing */}
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

        {/* Final CTA */}
        <section className="mx-4 mt-6 mb-6">
          <div className="relative h-52 rounded-3xl overflow-hidden shadow-lg">
            <Image 
              src="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80"
              alt="Célébration"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-800/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="text-lg font-bold text-white mb-1">
                Ton événement mérite<br />
                <span className="text-emerald-300">mieux qu'un stress</span>
              </h3>
              <p className="text-xs text-white/70 mb-3 leading-relaxed">
                Rejoins les 2 000+ organisateurs en RDC qui ont simplifié leur vie.<br />
                <strong className="text-white">C'est gratuit, 3 minutes, tu vas voir.</strong>
              </p>
              <Link href="/create">
                <button className="inline-flex items-center gap-1.5 bg-white text-emerald-700 text-sm font-bold py-2.5 px-5 rounded-xl shadow-md hover:bg-gray-50 transition-all active:scale-[0.98]">
                  <PartyPopper className="w-4 h-4" />
                  Créer mon invitation gratuite
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Tab Navigation (iOS style) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            {[
              { icon: 'home', label: 'Accueil', active: true, href: '/' },
              { icon: 'search', label: 'Explorer', active: false, href: '/dashboard' },
              { icon: 'plus', label: 'Créer', active: false, href: '/create' },
              { icon: 'heart', label: 'Favoris', active: false, href: '/' },
              { icon: 'user', label: 'Profil', active: false, href: '/dashboard' },
            ].map((tab, i) => (
              <Link key={i} href={tab.href} className="flex flex-col items-center gap-0.5 px-3 py-1">
                {tab.icon === 'home' && (
                  <svg className={`w-5 h-5 ${tab.active ? 'text-emerald-600' : 'text-gray-400'}`} viewBox="0 0 24 24" fill={tab.active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                )}
                {tab.icon === 'search' && (
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                )}
                {tab.icon === 'plus' && (
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center -mt-3 shadow-lg">
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
                <span className={`text-[10px] ${tab.active ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                  {tab.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}