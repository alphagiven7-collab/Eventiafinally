'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { EventType } from '@/types';
import { createEventFromTemplate } from '@/lib/utils/eventManager';

const eventTypes = [
  { 
    type: 'wedding' as EventType, 
    name: 'Mariage', 
    emoji: '💍', 
    color: 'from-rose-500 to-rose-600',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80'
  },
  { 
    type: 'birthday' as EventType, 
    name: 'Anniversaire', 
    emoji: '🎂', 
    color: 'from-amber-500 to-amber-600',
    image: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&q=80'
  },
  { 
    type: 'baby_shower' as EventType, 
    name: 'Baby Shower', 
    emoji: '👶', 
    color: 'from-blue-500 to-blue-600',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80'
  },
  { 
    type: 'graduation' as EventType, 
    name: 'Diplôme', 
    emoji: '🎓', 
    color: 'from-purple-500 to-purple-600',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80'
  },
  { 
    type: 'corporate' as EventType, 
    name: 'Corporate', 
    emoji: '💼', 
    color: 'from-gray-500 to-gray-600',
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&q=80'
  },
];

export default function CreateInvitationPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  const [eventName, setEventName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!selectedType || !eventName.trim() || creating) return;

    setCreating(true);

    try {
      // Mapping des types vers les slugs des modèles existants
      const templateMap: Record<EventType, string> = {
        wedding: 'yanick-keren',
        birthday: 'anniversaire-grace',
        baby_shower: 'yanick-keren',
        graduation: 'conference-tech-2026',
        corporate: 'conference-tech-2026',
      };

      const templateSlug = templateMap[selectedType];

      // Créer l'événement à partir du template
      const newEvent = await createEventFromTemplate(templateSlug, eventName.trim());
      
      if (newEvent) {
        // Rediriger vers l'éditeur de personnalisation
        router.push(`/create/${newEvent.slug}/edit`);
      } else {
        alert('Erreur lors de la création de l\'événement');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-base font-bold text-gray-900">Créer mon invitation</h1>
          <p className="text-[10px] text-gray-500 -mt-0.5">Choisis un modèle et personnalise-le</p>
        </div>
      </header>

      <main className="max-w-md mx-auto pb-20">
        {/* Step 1: Choose template */}
        <section className="px-4 mt-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">
            Étape 1 : Choisis ton type d'événement
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {eventTypes.map((template) => (
              <button
                key={template.type}
                onClick={() => setSelectedType(template.type)}
                className={`relative rounded-2xl overflow-hidden shadow-sm transition-all active:scale-[0.98] ${
                  selectedType === template.type
                    ? 'ring-4 ring-emerald-500 shadow-lg'
                    : 'ring-2 ring-white hover:ring-gray-200'
                }`}
              >
                <div className="relative h-32">
                  <Image
                    src={template.image}
                    alt={template.name}
                    fill
                    className="object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${template.color} opacity-60`} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <span className="text-3xl mb-1">{template.emoji}</span>
                    <span className="text-sm font-bold">{template.name}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: Event name */}
        {selectedType && (
          <section className="px-4 mt-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">
              Étape 2 : Donne un nom à ton événement
            </h3>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Ex: Mariage de Jean et Marie"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                autoFocus
              />
              
              <button
                onClick={handleCreate}
                disabled={!eventName.trim()}
                className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                Créer mon invitation
              </button>
            </div>
          </section>
        )}

        {/* Info note */}
        <section className="px-4 mt-6">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-xs text-blue-800 leading-relaxed">
              <strong>💡 Conseil :</strong> Choisis le type d'événement qui correspond le mieux. 
              Tu pourras personnaliser tous les textes, photos et couleurs après la création.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}