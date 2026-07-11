'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';

function CreateContent() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les événements existants
    async function loadEvents() {
      // TODO: Charger depuis Supabase
      setLoading(false);
    }
    loadEvents();
  }, []);

  const templates = [
    { slug: 'mariage-elegant', name: 'Mariage élégant', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80' },
    { slug: 'anniversaire-festif', name: 'Anniversaire festif', image: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&q=80' },
    { slug: 'conference-tech', name: 'Conférence tech', image: 'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=400&q=80' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Créer une invitation</h1>
          <p className="text-sm text-gray-500">Choisissez un template pour commencer</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Link
                key={template.slug}
                href={`/create/${template.slug}`}
                className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-48">
                  <img
                    src={template.image}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CreateContent />
    </Suspense>
  );
}