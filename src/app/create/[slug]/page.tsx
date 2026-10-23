'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { newDraftSlug, writeCreationDraft } from '@/lib/drafts/local-draft';
import { useAuth, SUPABASE_REQUIRED } from '@/providers/auth-provider';
import { useToast } from '@/components/ui';
import { EventWithSettings } from '@/types';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { ownedEventCount, publishInvitation } from '@/lib/events/store';
import { FREE_EVENT_LIMIT } from '@/constants/pricing';
import EventPermission from '@/components/account/EventPermission';

function Field({
  label,
  help,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {help && <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1.5 leading-snug">{help}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none transition"
      />
    </div>
  );
}

function CreateEventContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [coupleLeft, setCoupleLeft] = useState('');
  const [coupleRight, setCoupleRight] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);

  const computedTitle = [coupleLeft.trim(), coupleRight.trim()].filter(Boolean).join(' & ');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate || !location.trim()) {
      addToast('error', 'La date et le lieu sont obligatoires.');
      return;
    }

    const parsedDate = new Date(`${eventDate}T${eventTime || '00:00'}`);
    if (Number.isNaN(parsedDate.getTime())) {
      addToast('error', 'La date ou l’heure est invalide. Vérifiez-les (année à 4 chiffres).');
      return;
    }
    const eventIso = parsedDate.toISOString();

    const finalTitleEarly = computedTitle || 'Notre mariage';
    if (!user?.id) {
      const localSlug = newDraftSlug(finalTitleEarly);
      const draftEvent: EventWithSettings = {
        id: crypto.randomUUID(),
        slug: localSlug,
        title: finalTitleEarly,
        subtitle: computedTitle || undefined,
        type: 'wedding',
        event_date: eventIso,
        event_time: eventTime || undefined,
        location: location.trim(),
        venue: location.trim(),
        address: address.trim() || undefined,
        cover_image: '',
        coupleLeft: coupleLeft.trim() || undefined,
        coupleRight: coupleRight.trim() || undefined,
        branding: {
          primaryColor: '#5b21b6',
          accentColor: '#2563eb',
          heroImage: '',
          welcomeImage: '',
          ogShareImage: '',
        },
        rsvpButtonColor: '#7c3aed',
        sections: { gallery: true, countdown: true, dressCode: true, quiz: false, donation: false, guestbook: false },
        is_published: false,
        guestLimit: 3,
        invitationTemplate: 'ecran',
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await writeCreationDraft({ slug: localSlug, event: draftEvent, savedAt: new Date().toISOString() });
      addToast('success', 'Aperçu prêt. Le compte sera demandé seulement pour enregistrer ou publier.');
      router.push(`/create/${localSlug}/edit`);
      return;
    }

    if (!isSupabaseReady()) {
      addToast('error', SUPABASE_REQUIRED);
      return;
    }

    setLoading(true);
    const already = await ownedEventCount(createClient(), user.id);
    if (already != null && already >= FREE_EVENT_LIMIT) {
      setNeedsPermission(true);
      setLoading(false);
      addToast('error', `Vous avez déjà ${FREE_EVENT_LIMIT} mariages. Demandez la permission à l’admin.`);
      return;
    }


    const finalTitle = computedTitle || 'Notre mariage';
    const slug =
      finalTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') +
      '-' +
      Date.now().toString(36).slice(-4);

    const newEvent: EventWithSettings = {
      id: crypto.randomUUID(),
      slug,
      title: finalTitle,
      subtitle: computedTitle || undefined,
      type: 'wedding',
      event_date: eventIso,
      event_time: eventTime || undefined,
      location: location.trim(),
      venue: location.trim(),
      address: address.trim() || undefined,
      cover_image: '',
      coupleLeft: coupleLeft.trim() || undefined,
      coupleRight: coupleRight.trim() || undefined,
      branding: {
        primaryColor: '#5b21b6',
        accentColor: '#2563eb',
        heroImage: '',
        welcomeImage: '',
        ogShareImage: '',
      },
      rsvpButtonColor: '#7c3aed',
      sections: {
        gallery: true,
        countdown: true,
        dressCode: true,
        quiz: false,
        donation: false,
        guestbook: false,
      },
      user_id: user.id,
      is_published: false,
      guestLimit: 3,
      invitationTemplate: 'ecran',
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await publishInvitation(createClient(), newEvent);
    if (result.error) {
      addToast('error', result.error);
      setLoading(false);
      return;
    }

    addToast('success', 'Brouillon créé. Personnalisez la carte, puis publiez quand elle est prête.');
    router.push(`/create/${slug}/edit`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-slate-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans transition-colors">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-b border-rose-100 dark:border-gray-800">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <span className="font-bold text-base text-gray-900 dark:text-gray-100">Eventia</span>
          <button
            type="button"
            onClick={() => router.push(user ? '/dashboard' : '/')}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
          >
            ← Retour
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 text-center">
          Votre mariage
        </h1>

        {needsPermission && (
          <div className="mb-4">
            <EventPermission
              email={user?.email}
              name={typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : ''}
            />
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Premier prénom (optionnel)"
              help="Affiché sur la couverture et sur la carte d’invitation."
              value={coupleLeft}
              onChange={setCoupleLeft}
              placeholder="Ex: Marie"
            />
            <Field
              label="Second prénom (optionnel)"
              help="Affiché à côté du premier prénom."
              value={coupleRight}
              onChange={setCoupleRight}
              placeholder="Ex: Pierre"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Date"
              help="Affichée sur la carte, avec le compte à rebours."
              value={eventDate}
              onChange={setEventDate}
              type="date"
              required
            />
            <Field
              label="Heure (optionnel)"
              help="Affichée à côté de la date."
              value={eventTime}
              onChange={setEventTime}
              type="time"
            />
          </div>

          <Field
            label="Nom du lieu"
            help="Affiché sur la carte du lieu."
            value={location}
            onChange={setLocation}
            required
            placeholder="Ex: Domaine des Roses, Paris"
          />

          <Field
            label="Adresse (optionnel)"
            help="Sert au bouton d’itinéraire."
            value={address}
            onChange={setAddress}
            placeholder="Ex: 12 Avenue des Champs, 75008 Paris"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-violet-200/40 dark:shadow-violet-900/30 hover:shadow-xl transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'On prépare la page...' : 'Continuer ›'}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function CreateEventPage() {
  return <CreateEventContent />;
}
