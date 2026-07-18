'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const templates: Record<string, { name: string; image: string }> = {
  'mariage-elegant': {
    name: 'Mariage élégant',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  },
  'anniversaire-festif': {
    name: 'Anniversaire festif',
    image: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=800&q=80',
  },
  'conference-tech': {
    name: 'Conférence tech',
    image: 'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800&q=80',
  },
};

function CreateEventContent() {
  const params = useParams();
  const slug = params.slug as string;
  const template = templates[slug];
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulation de création
    setTimeout(() => {
      alert(`Événement "${eventName}" créé avec le template "${template?.name || slug}" !`);
      setIsSubmitting(false);
    }, 1000);
  };

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Template non trouvé</h1>
          <Link href="/create" className="text-emerald-600 hover:underline">
            Retour aux templates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Créer un événement</h1>
            <p className="text-sm text-gray-500">Template : {template.name}</p>
          </div>
          <Link href="/create" className="text-sm text-gray-600 hover:text-gray-900">
            ← Retour
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="relative h-48">
            <img
              src={template.image}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'événement
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Ex: Mariage de Paul et Marie"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lieu
              </label>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="Ex: Kinshasa, RDC"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Création...' : 'Créer mon invitation'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <ProtectedRoute>
      <CreateEventContent />
    </ProtectedRoute>
  );
}