'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function LandingTemplates() {
  return (
    <section className="mt-6">
      <div className="mx-4 flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-900">Modèles qui cartonnent</h3>
        <Link href="/create" className="text-xs text-emerald-600 font-medium">Tout voir</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
        {[
          { image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80', title: 'Romantique', type: 'Mariage', tag: '💍' },
          { image: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400&q=80', title: 'Festif', type: 'Anniversaire', tag: '🎂' },
          { image: 'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=400&q=80', title: 'Doux', type: 'Baby Shower', tag: '👶' },
          { image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80', title: 'Élégant', type: 'Diplôme', tag: '🎓' },
        ].map((tmpl, i) => (
          <div key={i} className="flex-shrink-0 w-44 snap-center">
            <div className="relative h-52 rounded-2xl overflow-hidden shadow-md">
              <Image src={tmpl.image} alt={tmpl.title} fill className="object-cover" />
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
  );
}