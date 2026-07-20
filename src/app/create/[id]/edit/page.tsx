'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useToast } from '@/components/ui';
import PhotoUploader from '@/components/ui/photo-uploader';
import { EventWithSettings } from '@/types';
import { getEventBySlug } from '@/data/events';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';

function EditEventContent() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const id = params.id as string;

  const [event, setEvent] = useState<EventWithSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Champs éditables
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [coverPhotos, setCoverPhotos] = useState<string[]>([]);
  const [heroPhotos, setHeroPhotos] = useState<string[]>([]);
  const [primaryColor, setPrimaryColor] = useState('#4caf50');
  const [accentColor, setAccentColor] = useState('#ec4899');
  const [musicUrl, setMusicUrl] = useState('');
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicVolume, setMusicVolume] = useState(35);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [gateHint, setGateHint] = useState('');
  const [aboutTitle, setAboutTitle] = useState('');
  const [mainText, setMainText] = useState('');

  useEffect(() => {
    async function loadEvent() {
      // 1. Chercher dans Supabase d'abord
      if (isSupabaseReady()) {
        try {
          const supabase = createClient();
          const { data: evtData } = await supabase
            .from('events')
            .select('*')
            .eq('slug', id)
            .single();

          if (evtData) {
            // Charger aussi event_settings
            const { data: settingsData } = await supabase
              .from('event_settings')
              .select('*')
              .eq('event_id', evtData.id)
              .maybeSingle();

            const merged = { ...evtData, ...(settingsData || {}) } as EventWithSettings;
            populateFields(merged);
            return;
          }
        } catch { /* fallback */ }
      }

      // 2. Chercher dans les événements hardcodés
      const evt = getEventBySlug(id);
      if (evt) {
        populateFields(evt);
        return;
      }

      // 3. Chercher dans localStorage
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('invitia_demo_events') || '[]');
        const found = stored.find((e: any) => e.slug === id);
        if (found) {
          populateFields(found as EventWithSettings);
          return;
        }
      }

      setLoading(false);
    }

    function populateFields(evt: EventWithSettings) {
      setEvent(evt);
      setTitle(evt.title || '');
      setSubtitle(evt.subtitle || '');
      setEventDate(evt.event_date ? new Date(evt.event_date).toISOString().split('T')[0] : '');
      setEventTime(evt.event_time || '');
      setLocation(evt.location || '');
      setAddress(evt.address || '');
      setDescription(evt.description || '');
      // Charger les photos existantes (URLs ou base64 stockés dans bestPhotos)
      const existingPhotos = evt.bestPhotos || [];
      setCoverPhotos(existingPhotos.length > 0 ? [existingPhotos[0]] : (evt.cover_image ? [evt.cover_image] : []));
      setHeroPhotos(evt.hero_image ? [evt.hero_image] : (existingPhotos.length > 1 ? [existingPhotos[1]] : []));
      setPrimaryColor(evt.branding?.primaryColor || '#4caf50');
      setAccentColor(evt.branding?.accentColor || '#ec4899');
      setMusicUrl(evt.ambiance?.musicUrl || '');
      setMusicEnabled(evt.ambiance?.enabled || false);
      setMusicVolume((evt.ambiance?.volume || 0.35) * 100);
      setWelcomeMessage(evt.welcomeMessage || '');
      setGateHint(evt.gateHint || '');
      setAboutTitle(evt.aboutTitle || '');
      setMainText(evt.mainText || '');
      setLoading(false);
    }

    loadEvent();
  }, [id]);

  const handleSave = async () => {
    if (!title || !eventDate || !location) {
      addToast('error', 'Titre, date et lieu sont obligatoires.');
      return;
    }

    setSaving(true);

    const updates = {
      title,
      subtitle,
      event_date: new Date(eventDate).toISOString(),
      event_time: eventTime,
      location,
      address,
      description,
      cover_image: coverPhotos[0] || '',
      hero_image: heroPhotos[0] || '',
      bestPhotos: [...coverPhotos, ...heroPhotos].filter(Boolean),
      primaryColor,
      accentColor,
      musicUrl,
      musicEnabled,
      musicVolume: musicVolume / 100,
      welcomeMessage,
      gateHint,
      aboutTitle,
      mainText,
    };

    // Sauvegarde localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`event_edit_${id}`, JSON.stringify(updates));
    }

    // Sauvegarde Supabase si dispo
    if (isSupabaseReady() && event?.id) {
      try {
        const supabase = createClient();
        await supabase
          .from('events')
          .update({
            title,
            subtitle,
            event_date: new Date(eventDate).toISOString(),
            event_time: eventTime || null,
            location,
            address: address || null,
            description: description || null,
            cover_image: coverPhotos[0] || null,
            hero_image: heroPhotos[0] || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', event.id);

        await supabase
          .from('event_settings')
          .upsert({
            event_id: event.id,
            welcome_message: welcomeMessage,
            gate_hint: gateHint,
            about_title: aboutTitle,
            main_text: mainText,
            branding: { primaryColor, accentColor },
            ambiance: { musicUrl, volume: musicVolume / 100, enabled: musicEnabled },
            updated_at: new Date().toISOString(),
          }, { onConflict: 'event_id' });
      } catch (err) {
        console.error('Erreur sauvegarde Supabase:', err);
      }
    }

    addToast('success', 'Modifications enregistrées !');
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-500">Événement introuvable</p>
          <button onClick={() => router.push('/dashboard')} className="mt-4 text-emerald-600 hover:underline">
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Personnaliser : {event.title}</h1>
            <p className="text-sm text-gray-500">Modifiez les paramètres de votre invitation</p>
          </div>
          <div className="flex gap-3">
            <a href={`/e/${event.slug}`} target="_blank" className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition">
              Aperçu →
            </a>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Informations générales */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">📝 Informations générales</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
                <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
                <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lieu *</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">🖼️ Photos de l'événement</h2>
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
        </section>

        {/* Couleurs */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">🎨 Couleurs</h2>
          <div className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
                <div className="flex gap-2">
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0" />
                  <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur accent</label>
                <div className="flex gap-2">
                  <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0" />
                  <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Musique */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">🎵 Musique d'ambiance</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={musicEnabled} onChange={(e) => setMusicEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
              <label className="text-sm text-gray-700">Activer la musique</label>
            </div>
            {musicEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL de la musique</label>
                  <input type="url" value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)}
                    placeholder="https://...mp3" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Volume ({Math.round(musicVolume)}%)</label>
                  <input type="range" min="0" max="100" value={musicVolume} onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                    className="w-full accent-emerald-600" />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Messages personnalisés */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">💬 Messages personnalisés</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message d'accueil (gate)</label>
              <textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Indice du gate</label>
              <input type="text" value={gateHint} onChange={(e) => setGateHint(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre "À propos"</label>
              <input type="text" value={aboutTitle} onChange={(e) => setAboutTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Texte principal</label>
              <textarea value={mainText} onChange={(e) => setMainText(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
            </div>
          </div>
        </section>

        {/* Bouton sauvegarde bas */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {saving ? 'Sauvegarde en cours...' : '💾 Sauvegarder toutes les modifications'}
        </button>
      </main>
    </div>
  );
}

export default function EditEventPage() {
  return (
    <ProtectedRoute>
      <EditEventContent />
    </ProtectedRoute>
  );
}