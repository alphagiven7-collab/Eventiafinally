'use client';

import { useRouter } from 'next/navigation';
import { Crown, Check, Users, QrCode, BarChart3, Download, Music, Image, MessageCircle } from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();

  const plans = [
    {
      name: 'Gratuit',
      price: '0',
      period: '',
      description: 'Pour découvrir Invitia',
      features: [
        '1 invitation',
        '5 photos maximum',
        'Personnalisation des textes',
        'Couleurs personnalisées',
        'Compte à rebours',
        'Lieu & programme',
      ],
      notIncluded: [
        'Pas de musique',
        'Pas de RSVP en ligne',
        'Pas d\'import CSV',
        'Pas de QR code',
      ],
      cta: 'Commencer gratuitement',
      highlighted: false,
      color: 'from-gray-500 to-gray-600',
    },
    {
      name: 'Premium',
      price: '30',
      period: 'une fois',
      description: 'Pour les grands événements',
      features: [
        'Invitations illimitées',
        '200 invités par événement',
        'RSVP en ligne + confirmation',
        'Musique de fond',
        '20 photos + galerie',
        'Import CSV d\'invités',
        'QR code jour J',
        'Analytics & statistiques',
        'Export CSV / JSON',
        'Relances WhatsApp',
        'Gestion des groupes',
        'Support prioritaire',
      ],
      cta: 'Passer à Premium',
      highlighted: true,
      color: 'from-rose-500 to-blue-500',
    },
    {
      name: 'Sur mesure',
      price: 'Sur devis',
      period: '',
      description: 'Pour les professionnels',
      features: [
        'Tout le Premium',
        'Design personnalisé',
        'Domaine propre',
        'Intégration API',
        'Impression cartes physiques',
        'Accompagnement dédié',
      ],
      cta: 'Demander un devis',
      highlighted: false,
      color: 'from-purple-500 to-indigo-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-b border-rose-100 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-5 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
            ← Retour
          </button>
          <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">Nos offres</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <p className="text-xs text-rose-500 font-medium uppercase tracking-wider mb-2">Invitia</p>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-3">
            Créez des invitations <span className="bg-gradient-to-r from-rose-500 to-blue-500 bg-clip-text text-transparent">inoubliables</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Invitations numériques élégantes avec RSVP, suivi des invités, musique, photos et bien plus.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border transition-all ${
                plan.highlighted
                  ? 'border-rose-300 dark:border-rose-700 shadow-xl shadow-rose-200/50 dark:shadow-rose-900/30 scale-[1.02]'
                  : 'border-gray-200 dark:border-gray-700 shadow-sm'
              } bg-white dark:bg-gray-800 overflow-hidden`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-rose-500 to-blue-500 text-white text-center py-1.5">
                  <span className="text-xs font-bold flex items-center justify-center gap-1">
                    <Crown className="w-3.5 h-3.5" /> Le plus populaire
                  </span>
                </div>
              )}

              <div className={`p-6 ${plan.highlighted ? 'pt-12' : ''}`}>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                    {plan.price === 'Sur devis' ? plan.price : `${plan.price}$`}
                  </span>
                  {plan.period && <span className="text-xs text-gray-400 dark:text-gray-500">{plan.period}</span>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">{plan.description}</p>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                  {(plan as any).notIncluded?.map((item: string) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5 text-red-400 text-xs font-bold">✕</span>
                      <span className="text-xs text-red-400 dark:text-red-500 line-through">{item}</span>
                    </li>
                  ))}
                </ul>

                {plan.name === 'Premium' ? (
                  <a
                    href="https://wa.me/243845370370?text=Bonjour%20Invitia%2C%20je%20souhaite%20passer%20%C3%A0%20Premium%20%2830%24%29"
                    target="_blank"
                    rel="noopener"
                    className={`block w-full py-3 bg-gradient-to-r ${plan.color} text-white rounded-xl text-sm font-bold text-center hover:shadow-lg transition-all active:scale-[0.98]`}
                  >
                    {plan.cta}
                  </a>
                ) : plan.name === 'Sur mesure' ? (
                  <a
                    href="https://wa.me/243845370370?text=Bonjour%20Invitia%2C%20je%20souhaite%20un%20devis%20sur%20mesure"
                    target="_blank"
                    rel="noopener"
                    className={`block w-full py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition`}
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <button
                    onClick={() => router.push('/create/wedding')}
                    className="block w-full py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Fonctionnalités Premium */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Ce que vous obtenez avec Premium</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Users, title: 'Suivi des invités', desc: 'Tableau complet avec statuts, groupes, recherche et filtres' },
              { icon: QrCode, title: 'QR code jour J', desc: 'Check-in rapide à l\'entrée avec scan QR' },
              { icon: BarChart3, title: 'Analytics', desc: 'Statistiques de vues, confirmations et taux de réponse' },
              { icon: Download, title: 'Exports', desc: 'Export CSV et JSON de vos listes d\'invités' },
              { icon: MessageCircle, title: 'Relances WhatsApp', desc: 'Messages personnalisés avec liens uniques' },
              { icon: Image, title: 'Import CSV', desc: 'Importez vos listes d\'invités depuis un fichier' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4.5 h-4.5 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{f.title}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: 'Le paiement est-il unique ou récurrent ?', a: 'Le paiement de 30$ est unique. Pas d\'abonnement, pas de renouvellement.' },
              { q: 'Puis-je essayer avant d\'acheter ?', a: 'Oui ! Le plan gratuit vous permet de créer 1 invitation avec 20 invités pour tester toutes les fonctionnalités de base.' },
              { q: 'Comment payer ?', a: 'Paiement via WhatsApp, Mobile Money ou virement. Vous recevez l\'accès Premium immédiatement après confirmation.' },
              { q: 'Que se passe-t-il si j\'ai plus de 200 invités ?', a: 'Contactez-nous pour un forfait sur mesure adapté à votre événement.' },
            ].map((faq) => (
              <div key={faq.q} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{faq.q}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}