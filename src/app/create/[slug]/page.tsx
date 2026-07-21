'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/components/ui';
import PhotoUploader from '@/components/ui/photo-uploader';
import { TEMPLATES } from '@/constants';
import { getEventIdentity } from '@/constants/design-language';
import { EventType } from '@/types';
import { saveEvent } from '@/lib/storage';

function CreateEventContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const slug = params.slug as string;
  const template = TEMPLATES.find((t) => t.slug === slug);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    eventType: 'wedding' as EventType,
    eventDate: '',
    eventTime: '',
    location: '',
    address: '',
    description: '',
  });
  const [coverPhotos, setCoverPhotos] = useState<string[]>([]);
  const [heroPhotos, setHeroPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const identity = getEventIdentity(formData.eventType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.eventDate || !formData.location) {
      addToast('error', 'Veuillez remplir les champs obligatoires.');
      return;
    }

    setLoading(true);

    // Créer l'événement avec les photos
    const slug = formData.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now().toString(36).slice(-4);

    const newEvent = {
      id: 'event_' + Date.now(),
      slug,
      title: formData.title,
      subtitle: formData.subtitle,
      type: formData.eventType,
      event_date: new Date(formData.eventDate + 'T' + (formData.eventTime || '00:00')).toISOString(),
      event_time: formData.eventTime,
      location: formData.location,
      address: formData.address,
      description: formData.description,
      cover_image: coverPhotos[0] || '',
      hero_image: heroPhotos[0] || '',
      bestPhotos: [...coverPhotos, ...heroPhotos].filter(Boolean),
      user_id: user?.id || 'demo_user',
      is_published: false,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Sauvegarder en IndexedDB (filtré par userId)
    if (user?.id) {
      await saveEvent(user.id, newEvent as any);
    }

    addToast('success', 'Événement créé ! Redirection vers l\'aperçu...');
    // Rediriger vers l'aperçu au lieu du dashboard
    router.push(`/e/${slug}`);
    setLoading(false);
  };

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

      <main className="max-w-lg mx-auto px-5 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mb-1">Créer votre invitation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Remplissez les informations ci-dessous</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Informations générales */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Informations générales</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Titre *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Mariage de Paul et Marie" required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none transition" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sous-titre</label>
                <input type="text" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} placeholder="Un message court"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none transition" />
              </div>
            </div>
          </div>

          {/* Date et lieu */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Date et lieu</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date *</label>
                  <input type="date" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} required
                    className="w-full px-3 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Heure</label>
                  <input type="time" value={formData.eventTime} onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                    className="w-full px-3 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none transition" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lieu *</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Ex: Sultani River, Kinshasa" required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none transition" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Adresse</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Ex: 32, avenue de la Justice, Gombe"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none transition" />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Photos</h2>
            <div className="space-y-5">
              <PhotoUploader onPhotosChange={setCoverPhotos} existingPhotos={coverPhotos} maxPhotos={10} label="Vos photos" />
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Description</h2>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Décrivez votre événement..." rows={3}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none resize-none transition" />
          </div>

          {/* Bouton */}
          <button type="submit" disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-rose-500 to-blue-500 text-white rounded-2xl font-bold text-base shadow-xl shadow-rose-200/50 dark:shadow-rose-900/30 hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50">
            {loading ? 'Création...' : 'Créer et voir l\'aperçu'}
          </button>
        </form>
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