'use client';

import { EventWithSettings } from '@/types';

interface DressCodeProps {
  event: EventWithSettings;
}

export default function DressCode({ event }: DressCodeProps) {
  if (!event.dressCodeTitle) return null;

  return (
    <section className="px-4 mt-8 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <h3 className="font-serif text-2xl text-gray-900 mb-2">
          {event.dressCodeTitle}
        </h3>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-6 font-medium">
          Couleurs suggérées
        </p>
        
        <div className="flex justify-center gap-4">
          <div className="group">
            <div className="w-16 h-16 rounded-full bg-[#f4e1e1] shadow-lg border-2 border-white group-hover:scale-110 transition-transform" />
            <p className="text-[10px] text-gray-500 mt-2">Rose poudré</p>
          </div>
          <div className="group">
            <div className="w-16 h-16 rounded-full bg-[#5a2a35] shadow-lg border-2 border-white group-hover:scale-110 transition-transform" />
            <p className="text-[10px] text-gray-500 mt-2">Bordeaux</p>
          </div>
          <div className="group">
            <div className="w-16 h-16 rounded-full bg-[#f5f5dc] shadow-lg border-2 border-white group-hover:scale-110 transition-transform" />
            <p className="text-[10px] text-gray-500 mt-2">Crème</p>
          </div>
        </div>
      </div>
    </section>
  );
}