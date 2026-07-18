'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { TEMPLATES } from '@/constants';

const TEMPLATE_IMAGES: Record<string, string> = {
  elegant: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
  modern: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400&q=80',
  floral: 'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=400&q=80',
  nature: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80',
  minimal: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&q=80',
};

function CreateContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Créer une invitation</h1>
          <p className="text-sm text-gray-500">Choisissez un template pour commencer</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEMPLATES.map((template) => (
            <Link
              key={template.slug}
              href={`/create/${template.slug}`}
              className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative h-48">
                <img
                  src={TEMPLATE_IMAGES[template.slug] ?? TEMPLATE_IMAGES.elegant}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{template.description}</p>
              </div>
            </Link>
          ))}
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
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <CreateContent />
      </Suspense>
    </ProtectedRoute>
  );
}