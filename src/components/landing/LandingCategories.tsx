'use client';

import Image from 'next/image';

export default function LandingCategories() {
  return (
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
  );
}