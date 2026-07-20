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

    // Sauvegarder en localStorage
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('invitia_demo_events') || '[]');
      stored.push(newEvent);
      localStorage.setItem('invitia_demo_events', JSON.stringify(stored));
    }

    addToast('success', 'Événement créé avec succès !');
    router.push('/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: identity.palette.background }}>
      <header className="border-b sticky top-0 z-40 backdrop-blur-xl" style={{ backgroundColor: identity.palette.surface, borderColor: identity.palette.border }}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold" style={{ color: identity.palette.text }}>
            {template ? `Créer : ${template.name}` : 'Créer un événement'}
          </h1>
          <p className="text-sm" style={{ color: identity.palette.textMuted }}>
            {template?.description || 'Remplissez les informations de votre événement'}
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl shadow-sm border p-6" style={{ backgroundColor: identity.palette.surface, borderColor: identity.palette.border }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: identity.palette.text }}>📝 Informations générales</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: identity.palette.text }}>Titre de l'événement *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Mariage de Paul et Marie"
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none transition"
                  style={{ borderColor: identity.palette.border, backgroundColor: identity.palette.background }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: identity.palette.text }}>Sous-titre</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Un message court"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none transition"
                  style={{ borderColor: identity.palette.border, backgroundColor: identity.palette.background }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: identity.palette.text }}>Type d'événement</label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value as EventType })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none transition"
                  style={{ borderColor: identity.palette.border, backgroundColor: identity.palette.background, color: identity.palette.text }}
                >
                  <option value="wedding">💍 Mariage</option>
                  <option value="engagement">💕 Fiançailles</option>
                  <option value="birthday">🎂 Anniversaire</option>
                  <option value="baby_shower">👶 Baby Shower</option>
                  <option value="religious">🙏 Religieux</option>
                  <option value="graduation">🎓 Diplôme</option>
                  <option value="corporate">💼 Corporate</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl shadow-sm border p-6" style={{ backgroundColor: identity.palette.surface, borderColor: identity.palette.border }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: identity.palette.text }}>📅 Date et lieu</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: identity.palette.text }}>Date *</label>
                  <input type="date" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none transition"
                    style={{ borderColor: identity.palette.border, backgroundColor: identity.palette.background, color: identity.palette.text }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: identity.palette.text }}>Heure</label>
                  <input type="time" value={formData.eventTime} onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none transition"
                    style={{ borderColor: identity.palette.border, backgroundColor: identity.palette.background, color: identity.palette.text }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: identity.palette.text }}>Lieu *</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Sultani River, Kinshasa" required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none transition"
                  style={{ borderColor: identity.palette.border, backgroundColor: identity.palette.background, color: identity.palette.text }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: identity.palette.text }}>Adresse complète</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ex: 32, avenue de la Justice, Gombe"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none transition"
                  style={{ borderColor: identity.palette.border, backgroundColor: identity.palette.background, color: identity.palette.text }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl shadow-sm border p-6" style={{ backgroundColor: identity.palette.surface, borderColor: identity.palette.border }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: identity.palette.text }}>🖼️ Photos</h2>
            <div className="space-y-6">
              <PhotoUploader
                onPhotosChange={setCoverPhotos}
                existingPhotos={coverPhotos}
                maxPhotos={1}
                label="Photo de couverture"
              />
              <PhotoUploader
                onPhotosChange={setHeroPhotos}
                existingPhotos={heroPhotos}
                maxPhotos={1}
                label="Photo hero (plein écran)"
              />
            </div>
          </div>

          <div className="rounded-2xl shadow-sm border p-6" style={{ backgroundColor: identity.palette.surface, borderColor: identity.palette.border }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: identity.palette.text }}>📝 Description</h2>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez votre événement..."
              rows={4}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none resize-none transition"
              style={{ borderColor: identity.palette.border, backgroundColor: identity.palette.background, color: identity.palette.text }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-white rounded-xl font-bold text-lg transition disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: identity.palette.primary }}
          >
            {loading ? 'Création...' : 'Créer l\'événement'}
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