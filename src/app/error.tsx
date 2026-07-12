'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Erreur globale:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">📱</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Problème de connexion
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          La navigation a été interrompue. Cela arrive parfois sur mobile.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-xl text-sm font-semibold transition"
          >
            🔄 Réessayer
          </button>
          <a
            href="/"
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl text-sm font-semibold transition text-center"
          >
            🏠 Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}