'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, CheckCircle, PartyPopper, XCircle, Phone, Search } from 'lucide-react';

export default function LandingHero() {
  return (
    <>
      {/* Hero Section */}
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

      {/* Problem / Solution */}
      <section className="mx-4 mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 text-center mb-4">
            Le vrai problème des invitations en RDC
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-red-800">Tu passes des heures à designer</p>
                <p className="text-[10px] text-red-600">Canva, Photoshop, demander à un ami graphiste… tu perds 3 jours pour une invitation.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-red-800">Envoyer sur WhatsApp est un calvaire</p>
                <p className="text-[10px] text-red-600">Ajouter chaque contact un par un, pas de suivi, oublis… tes invités ne reçoivent rien.</p>
              </div>
            </div>
            
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
    </>
  );
}