'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useToast } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import PhotoUploader from '@/components/ui/photo-uploader';
import { EventWithSettings } from '@/types';
import { getEventBySlug } from '@/data/events';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { getUserEvents, saveEvent } from '@/lib/storage';

function EditEventContent() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventWithSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [coverPhotos, setCoverPhotos] = useState<string[]>([]);
  const [primaryColor, setPrimaryColor] = useState('#4caf50');
  const [accentColor, setAccentColor] = useState('#ec4899');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [mainText, setMainText] = useState('');

  useEffect(() => {
    async function loadEvent() {
      if (isSupabaseReady()) {
        try {
          const supabase = createClient();
          const { data: evtData } = await supabase.from('events').select('*').eq('slug', slug).single();
          if (evtData) { populateFields(evtData as EventWithSettings); return; }
        } catch {}
      }
      const evt = getEventBySlug(slug);
      if (evt) { populateFields(evt); return; }
      if (user?.id) {
        const userEvts = await getUserEvents(user.id);
        const found = userEvts.find((e) => e.slug === slug);
        if (found) { populateFields(found); return; }
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
      setCoverPhotos(evt.bestPhotos || (evt.cover_image ? [evt.cover_image] : []));
      setPrimaryColor(evt.branding?.primaryColor || '#4caf50');
      setAccentColor(evt.branding?.accentColor || '#ec4899');
      setWelcomeMessage(evt.welcomeMessage || '');
      setMainText(evt.mainText || '');
      setLoading(false);
    }

    loadEvent();
  }, [slug, user?.id]);

  const handleSave = async () => {
    if (!title || !eventDate || !location) { addToast('error', 'Titre, date et lieu sont obligatoires.'); return; }
    setSaving(true);

    const updatedEvent: EventWithSettings = {
      ...event!,
      title, subtitle,
      event_date: new Date(eventDate).toISOString(),
      event_time: eventTime, location, address, description,
      cover_image: coverPhotos[0] || '',
      bestPhotos: coverPhotos,
      branding: { ...event?.branding, primaryColor, accentColor } as any,
      welcomeMessage, mainText,
      updated_at: new Date().toISOString(),
    };

    if (user?.id) {
      await saveEvent(user.id, updatedEvent);
    }

    if (isSupabaseReady() && event?.id) {
      try {
        const supabase = createClient();
        await supabase.from('events').update({
          title, subtitle, event_date: new Date(eventDate).toISOString(),
          event_time: eventTime || null, location, address: address || null,
          description: description || null, cover_image: coverPhotos[0] || null,
          updated_at: new Date().toISOString(),
        }).eq('id', event.id);
      } catch (err) { console.error('Erreur sauvegarde Supabase:', err); }
    }

    addToast('success', 'Modifications enregistrées !');
    router.push(`/e/${event?.slug || slug}`);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-xl text-gray-500 dark:text-gray-400">Événement introuvable</p>
          <button onClick={() => router.push('/dashboard')} className="mt-4 text-rose-600 dark:text-rose-400 hover:underline">Retour au dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans transition-colors">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-b border-rose-100 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">Modifier : {event.title}</h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Personnalisez votre invitation</p>
          </div>
          <div className="flex gap-2">
            <a href={`/e/${event.slug}`} target="_blank" className="px-3 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition">Aperçu</a>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-gradient-to-r from-rose-500 to-blue-500 text-white rounded-lg text-xs font-medium hover:shadow-lg transition disabled:opacity-50">{saving ? '...' : 'Sauvegarder'}</button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-5">
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Informations générales</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Titre *</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none" /></div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sous-titre</label><input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date *</label><input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none" /></div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Heure</label><input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none" /></div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lieu *</label><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none" /></div>
            </div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Adresse</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none" /></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none resize-none" /></div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Photos</h2>
          <PhotoUploader onPhotosChange={setCoverPhotos} existingPhotos={coverPhotos} maxPhotos={10} label="Vos photos" />
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Couleurs</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Couleur principale</label><div className="flex gap-2"><input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" /><input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" /></div></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Couleur accent</label><div className="flex gap-2"><input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" /><input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" /></div></div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Messages personnalisés</h2>
          <div className="space-y-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message d'accueil</label><textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none resize-none" /></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Texte principal</label><textarea value={mainText} onChange={(e) => setMainText(e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none resize-none" /></div>
          </div>
        </section>

        <button onClick={handleSave} disabled={saving} className="w-full py-4 bg-gradient-to-r from-rose-500 to-blue-500 text-white rounded-2xl font-bold text-base shadow-xl shadow-rose-200/50 dark:shadow-rose-900/30 hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50">
          {saving ? 'Sauvegarde...' : 'Sauvegarder et voir l\'aperçu'}
        </button>
      </main>
    </div>
  );
}

export default function EditEventPage() {
  return <ProtectedRoute><EditEventContent /></ProtectedRoute>;
}