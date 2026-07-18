'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/providers/auth-provider';
import { PartyPopper, Clock3 } from 'lucide-react';
import { ThemeToggle } from '@/providers/theme-toggle';
import LandingHero from '@/components/landing/LandingHero';
import LandingStats from '@/components/landing/LandingStats';
import LandingHowItWorks from '@/components/landing/LandingHowItWorks';
import LandingCategories from '@/components/landing/LandingCategories';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingTemplates from '@/components/landing/LandingTemplates';
import LandingTestimonials from '@/components/landing/LandingTestimonials';
import LandingPricing from '@/components/landing/LandingPricing';

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
              <Link href="/dashboard">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer hover:opacity-80">
                  {(user.user_metadata?.name || 'U').charAt(0).toUpperCase()}
                </div>
              </Link>
            ) : (
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
        <LandingHero />
        <LandingStats />
        <LandingHowItWorks />
        <LandingCategories />
        <LandingFeatures />
        <LandingTemplates />
        <LandingTestimonials />

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

        <LandingPricing />

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