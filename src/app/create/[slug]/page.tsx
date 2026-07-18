'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { TEMPLATES } from '@/constants';

function CreateEventContent() {
  const params = useParams();
  const slug = params.slug as string;
  const template = TEMPLATES.find((t) => t.slug === slug);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            {template ? `Créer : ${template.name}` : 'Créer un événement'}
          </h1>
          <p className="text-sm text-gray-500">
            {template
              ? `Template "${template.description}"`
              : 'Personnalisez votre invitation'}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold mb-4">Détails de l'événement</h2>
          <p className="text-gray-500 text-sm">
            Formulaire de création d'événement à implémenter.
          </p>
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