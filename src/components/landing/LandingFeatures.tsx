'use client';

import { Clock, MessageCircle, Users, Shield } from 'lucide-react';

export default function LandingFeatures() {
  return (
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
  );
}