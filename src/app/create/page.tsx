'use client';

import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Sparkles } from 'lucide-react';

function CreateContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans transition-colors">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-b border-rose-100 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36">
                  <stop offset="0%" stopColor="#f472b6"/>
                  <stop offset="100%" stopColor="#3b82f6"/>
                </linearGradient>
              </defs>
              <rect width="36" height="36" rx="10" fill="url(#logoGrad)"/>
              <path d="M10 16.5l8-5 8 5v7a2 2 0 01-2 2H12a2 2 0 01-2-2v-7z" fill="white" opacity="0.9"/>
              <path d="M18 16l-2 7h4l-2-7z" fill="url(#logoGrad)" opacity="0.8"/>
              <circle cx="14" cy="20" r="1.5" fill="white"/>
              <circle cx="22" cy="20" r="1.5" fill="white"/>
              <path d="M17.5 21.5a1.5 1.5 0 001.5 1.5 1.5 1.5 0 001.5-1.5" stroke="white" strokeWidth="0.8" fill="none"/>
            </svg>
            <span className="font-bold text-base text-gray-900 dark:text-gray-100">Invitia</span>
          </div>
          <button onClick={() => router.push('/dashboard')} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
            ← Retour
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">
            Creez votre invitation
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Un seul template. Une seule identite. La votre.
          </p>
        </div>

        {/* Template unique */}
        <div
          onClick={() => router.push('/create/wedding')}
          className="cursor-pointer group"
        >
          <div className="relative h-64 rounded-3xl overflow-hidden shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80"
              alt="Template Mariage"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-medium text-rose-300 uppercase tracking-wider">Invitia</span>
              </div>
              <h2 className="text-xl font-bold text-white">Mariage</h2>
              <p className="text-xs text-white/80 mt-0.5">L'invitation qui donne envie d'etre present</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center">
            <button className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-rose-500 to-blue-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-rose-200/50 dark:shadow-rose-900/30 hover:shadow-2xl transition-all active:scale-95">
              <Sparkles className="w-4 h-4" />
              Commencer
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CreatePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <CreateContent />
      </Suspense>
    </ProtectedRoute>
  );
}