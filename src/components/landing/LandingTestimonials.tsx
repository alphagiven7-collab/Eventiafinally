'use client';

export default function LandingTestimonials() {
  return (
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
  );
}