'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useToast } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import PhotoUploader from '@/components/ui/photo-uploader';
import {
  EventWithSettings,
  ProgramItem,
  PracticalInfoItem,
} from '@/types';
import { getEventBySlug } from '@/data/events';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { getUserEvents, saveEvent } from '@/lib/storage';

/* ─────────────────────────────────────────────
   Section collapsible réutilisable
   ───────────────────────────────────────────── */
function Section({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{icon}</span>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h2>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700">{children}</div>}
    </section>
  );
}

/* ─────────────────────────────────────────────
   Composant champ texte réutilisable
   ───────────────────────────────────────────── */
function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  const base =
    'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none transition';
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Éditeur de programme (liste dynamique)
   ───────────────────────────────────────────── */
function ProgramEditor({
  items,
  onChange,
}: {
  items: ProgramItem[];
  onChange: (items: ProgramItem[]) => void;
}) {
  const addItem = () => onChange([...items, { time: '', title: '', color: 'pink' }]);
  const updateItem = (i: number, field: keyof ProgramItem, val: string) => {
    const copy = [...items];
    copy[i] = { ...copy[i], [field]: val };
    onChange(copy);
  };
  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3 mt-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex gap-2 items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600"
        >
          <div className="flex-1 grid grid-cols-3 gap-2">
            <input
              type="text"
              value={item.time}
              onChange={(e) => updateItem(i, 'time', e.target.value)}
              placeholder="19h30"
              className="px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(i, 'title', e.target.value)}
              placeholder="Cérémonie"
              className="col-span-2 px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <select
            value={item.color}
            onChange={(e) => updateItem(i, 'color', e.target.value)}
            className="px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="pink">🌹 Rose</option>
            <option value="blue">💙 Bleu</option>
            <option value="green">💚 Vert</option>
            <option value="purple">💜 Violet</option>
          </select>
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-rose-300 hover:text-rose-500 transition"
      >
        + Ajouter une étape
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Éditeur d'infos pratiques (liste dynamique)
   ───────────────────────────────────────────── */
function PracticalInfoEditor({
  items,
  onChange,
}: {
  items: PracticalInfoItem[];
  onChange: (items: PracticalInfoItem[]) => void;
}) {
  const addItem = () => onChange([...items, { icon: 'car', title: '', text: '' }]);
  const updateItem = (i: number, field: keyof PracticalInfoItem, val: string) => {
    const copy = [...items];
    copy[i] = { ...copy[i], [field]: val };
    onChange(copy);
  };
  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3 mt-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 space-y-2"
        >
          <div className="flex gap-2 items-center">
            <select
              value={item.icon}
              onChange={(e) => updateItem(i, 'icon', e.target.value)}
              className="px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="car">🚗 Voiture</option>
              <option value="bed">🏨 Hébergement</option>
              <option value="wine">🍷 Bar</option>
            </select>
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(i, 'title', e.target.value)}
              placeholder="Titre (ex: Parking)"
              className="flex-1 px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            >
              ✕
            </button>
          </div>
          <textarea
            value={item.text}
            onChange={(e) => updateItem(i, 'text', e.target.value)}
            placeholder="Description..."
            rows={2}
            className="w-full px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-rose-300 hover:text-rose-500 transition"
      >
        + Ajouter une info
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE PRINCIPALE
   ═══════════════════════════════════════════════ */
function EditEventContent() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventWithSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Informations générales ──
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [coupleLeft, setCoupleLeft] = useState('');
  const [coupleRight, setCoupleRight] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // ── Welcome Gate ──
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [gateHint, setGateHint] = useState('');

  // ── Hero / Images ──
  const [heroImage, setHeroImage] = useState('');
  const [welcomeImage, setWelcomeImage] = useState('');
  const [coverPhotos, setCoverPhotos] = useState<string[]>([]);

  // ── Texte d'invitation ──
  const [inviteIntro, setInviteIntro] = useState('');
  const [inviteSecondary, setInviteSecondary] = useState('');
  const [mainText, setMainText] = useState('');
  const [reserveText, setReserveText] = useState('');
  const [rsvpDeadlineText, setRsvpDeadlineText] = useState('');

  // ── Couleurs / Branding ──
  const [primaryColor, setPrimaryColor] = useState('#4caf50');
  const [accentColor, setAccentColor] = useState('#ec4899');
  const [rsvpButtonColor, setRsvpButtonColor] = useState('#ec4899');

  // ── À propos ──
  const [aboutTitle, setAboutTitle] = useState('');
  const [aboutStory1, setAboutStory1] = useState('');
  const [aboutStory2, setAboutStory2] = useState('');
  const [aboutImage, setAboutImage] = useState('');

  // ── Programme ──
  const [programSectionTitle, setProgramSectionTitle] = useState('');
  const [program, setProgram] = useState<ProgramItem[]>([]);

  // ── Lieu / Venue ──
  const [venue, setVenue] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueMapImage, setVenueMapImage] = useState('');
  const [venueMapLink, setVenueMapLink] = useState('');

  // ── Dress Code ──
  const [dressCodeTitle, setDressCodeTitle] = useState('');
  const [dressImages, setDressImages] = useState<string[]>([]);

  // ── Infos pratiques ──
  const [practicalSectionTitle, setPracticalSectionTitle] = useState('');
  const [practicalInfo, setPracticalInfo] = useState<PracticalInfoItem[]>([]);

  // ── Musique / Ambiance ──
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicUrl, setMusicUrl] = useState('');
  const [musicVolume, setMusicVolume] = useState(35);

  // ── Liens ──
  const [supportEmail, setSupportEmail] = useState('');
  const [mapLink, setMapLink] = useState('');
  const [donationLink, setDonationLink] = useState('');
  const [whatsappDonation, setWhatsappDonation] = useState('');
  const [whatsappDonationMessage, setWhatsappDonationMessage] = useState('');

  // ── Sections toggle ──
  const [secGallery, setSecGallery] = useState(true);
  const [secCountdown, setSecCountdown] = useState(true);
  const [secDressCode, setSecDressCode] = useState(true);

  // ── Admin ──
  const [adminCode, setAdminCode] = useState('');

  /* ── Chargement de l'événement ── */
  useEffect(() => {
    async function loadEvent() {
      if (isSupabaseReady()) {
        try {
          const supabase = createClient();
          const { data: evtData } = await supabase
            .from('events')
            .select('*')
            .eq('slug', slug)
            .single();
          if (evtData) {
            populateFields(evtData as EventWithSettings);
            return;
          }
        } catch {}
      }
      const evt = getEventBySlug(slug);
      if (evt) {
        populateFields(evt);
        return;
      }
      if (user?.id) {
        const userEvts = await getUserEvents(user.id);
        const found = userEvts.find((e) => e.slug === slug);
        if (found) {
          populateFields(found);
          return;
        }
      }
      setLoading(false);
    }

    function populateFields(evt: EventWithSettings) {
      setEvent(evt);
      setTitle(evt.title || '');
      setSubtitle(evt.subtitle || '');
      setCoupleLeft(evt.coupleLeft || '');
      setCoupleRight(evt.coupleRight || '');
      setEventDate(evt.event_date ? new Date(evt.event_date).toISOString().split('T')[0] : '');
      setEventTime(evt.event_time || '');
      setLocation(evt.location || '');
      setAddress(evt.address || '');
      setDescription(evt.description || '');
      setMetaDescription(evt.metaDescription || '');
      setWelcomeMessage(evt.welcomeMessage || '');
      setGateHint(evt.gateHint || '');
      setHeroImage(evt.heroImage || evt.branding?.heroImage || '');
      setWelcomeImage(evt.welcomeImage || evt.branding?.welcomeImage || '');
      setCoverPhotos(evt.bestPhotos || (evt.cover_image ? [evt.cover_image] : []));
      setInviteIntro(evt.inviteIntro || '');
      setInviteSecondary(evt.inviteSecondary || '');
      setMainText(evt.mainText || '');
      setReserveText(evt.reserveText || '');
      setRsvpDeadlineText(evt.rsvpDeadlineText || '');
      setPrimaryColor(evt.branding?.primaryColor || '#4caf50');
      setAccentColor(evt.branding?.accentColor || '#ec4899');
      setRsvpButtonColor(evt.rsvpButtonColor || '#ec4899');
      setAboutTitle(evt.aboutTitle || '');
      setAboutStory1(evt.aboutStory1 || '');
      setAboutStory2(evt.aboutStory2 || '');
      setAboutImage(evt.aboutImage || '');
      setProgramSectionTitle(evt.programSectionTitle || '');
      setProgram(evt.program || []);
      setVenue(evt.venue || '');
      setVenueAddress(evt.venueDetails?.address || '');
      setVenueMapImage(evt.venueDetails?.mapImage || '');
      setVenueMapLink(evt.links?.map || evt.mapLink || '');
      setDressCodeTitle(evt.dressCodeTitle || '');
      setDressImages(evt.dressImages || []);
      setPracticalSectionTitle(evt.practicalSectionTitle || '');
      setPracticalInfo(evt.practicalInfo || []);
      setMusicEnabled(evt.ambiance?.enabled || false);
      setMusicUrl(evt.ambiance?.musicUrl || '');
      setMusicVolume(Math.round((evt.ambiance?.volume || 0.35) * 100));
      setSupportEmail(evt.links?.supportEmail || evt.supportEmail || '');
      setMapLink(evt.links?.map || evt.mapLink || '');
      setDonationLink(evt.links?.donation || '');
      setWhatsappDonation(evt.links?.whatsappDonation || '');
      setWhatsappDonationMessage(evt.links?.donationWhatsAppMessage || '');
      setSecGallery(evt.sections?.gallery !== false);
      setSecCountdown(evt.sections?.countdown !== false);
      setSecDressCode(evt.sections?.dressCode !== false);
      setAdminCode(evt.adminCode || '');
      setLoading(false);
    }

    loadEvent();
  }, [slug, user?.id]);

  /* ── Sauvegarde ── */
  const handleSave = useCallback(async () => {
    if (!title || !eventDate || !location) {
      addToast('error', 'Titre, date et lieu sont obligatoires.');
      return;
    }
    setSaving(true);

    const updatedEvent: EventWithSettings = {
      ...event!,
      title,
      subtitle,
      coupleLeft: coupleLeft || undefined,
      coupleRight: coupleRight || undefined,
      event_date: new Date(eventDate).toISOString(),
      event_time: eventTime || undefined,
      location,
      address: address || undefined,
      description: description || undefined,
      metaDescription: metaDescription || undefined,
      cover_image: coverPhotos[0] || '',
      bestPhotos: coverPhotos,
      heroImage: heroImage || undefined,
      welcomeImage: welcomeImage || undefined,
      welcomeMessage: welcomeMessage || undefined,
      gateHint: gateHint || undefined,
      inviteIntro: inviteIntro || undefined,
      inviteSecondary: inviteSecondary || undefined,
      mainText: mainText || undefined,
      reserveText: reserveText || undefined,
      rsvpDeadlineText: rsvpDeadlineText || undefined,
      rsvpButtonColor: rsvpButtonColor || undefined,
      branding: {
        primaryColor,
        accentColor,
        heroImage: heroImage || '',
        welcomeImage: welcomeImage || '',
        ogShareImage: coverPhotos[0] || '',
      },
      aboutTitle: aboutTitle || undefined,
      aboutStory1: aboutStory1 || undefined,
      aboutStory2: aboutStory2 || undefined,
      aboutImage: aboutImage || undefined,
      programSectionTitle: programSectionTitle || undefined,
      program: program.length > 0 ? program : undefined,
      venue: venue || undefined,
      venueDetails:
        venue || venueAddress || venueMapImage
          ? {
              title: venue || location,
              address: venueAddress || address || '',
              lat: '',
              lng: '',
              mapImage: venueMapImage || '',
            }
          : undefined,
      dressCodeTitle: dressCodeTitle || undefined,
      dressImages: dressImages.length > 0 ? dressImages : undefined,
      practicalSectionTitle: practicalSectionTitle || undefined,
      practicalInfo: practicalInfo.length > 0 ? practicalInfo : undefined,
      ambiance: musicEnabled
        ? { enabled: true, musicUrl, volume: musicVolume / 100 }
        : { enabled: false, musicUrl: '', volume: 0.35 },
      links: {
        map: mapLink || undefined,
        supportEmail: supportEmail || undefined,
        donation: donationLink || undefined,
        whatsappDonation: whatsappDonation || undefined,
        donationWhatsAppMessage: whatsappDonationMessage || undefined,
      },
      supportEmail: supportEmail || undefined,
      mapLink: mapLink || undefined,
      sections: {
        gallery: secGallery,
        countdown: secCountdown,
        dressCode: secDressCode,
        quiz: event?.sections?.quiz || false,
        donation: event?.sections?.donation || false,
        guestbook: event?.sections?.guestbook || false,
      },
      adminCode: adminCode || undefined,
      updated_at: new Date().toISOString(),
    };

    // Sauvegarde locale
    if (user?.id) {
      await saveEvent(user.id, updatedEvent);
    }

    // Sauvegarde Supabase
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
            updated_at: new Date().toISOString(),
          })
          .eq('id', event.id);
      } catch (err) {
        console.error('Erreur sauvegarde Supabase:', err);
      }
    }

    addToast('success', 'Modifications enregistrées !');
    router.push(`/e/${event?.slug || slug}`);
    setSaving(false);
  }, [
    title, subtitle, coupleLeft, coupleRight, eventDate, eventTime, location, address,
    description, metaDescription, coverPhotos, heroImage, welcomeImage, welcomeMessage,
    gateHint, inviteIntro, inviteSecondary, mainText, reserveText, rsvpDeadlineText,
    rsvpButtonColor, primaryColor, accentColor, aboutTitle, aboutStory1, aboutStory2,
    aboutImage, programSectionTitle, program, venue, venueAddress, venueMapImage,
    venueMapLink, dressCodeTitle, dressImages, practicalSectionTitle, practicalInfo,
    musicEnabled, musicUrl, musicVolume, supportEmail, mapLink, donationLink,
    whatsappDonation, whatsappDonationMessage, secGallery, secCountdown, secDressCode,
    adminCode, event, slug, user?.id, addToast, router,
  ]);

  /* ── Loading / Not found ── */
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
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-rose-600 dark:text-rose-400 hover:underline"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans transition-colors">
      {/* Header sticky */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-b border-rose-100 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Modifier : {event.title}
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Personnalisez votre invitation
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={`/e/${event.slug}`}
              target="_blank"
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Aperçu
            </a>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-blue-500 text-white rounded-lg text-xs font-medium hover:shadow-lg transition disabled:opacity-50"
            >
              {saving ? '...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-4">
        {/* ═══════ 1. INFORMATIONS GÉNÉRALES ═══════ */}
        <Section title="Informations générales" icon="📝" defaultOpen>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Titre de l'événement" value={title} onChange={setTitle} required />
              <Field label="Sous-titre" value={subtitle} onChange={setSubtitle} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Prénom du/de la marié(e) gauche" value={coupleLeft} onChange={setCoupleLeft} placeholder="Ex: Marie" />
              <Field label="Prénom du/de la marié(e) droit" value={coupleRight} onChange={setCoupleRight} placeholder="Ex: Pierre" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Date" value={eventDate} onChange={setEventDate} type="date" required />
              <Field label="Heure" value={eventTime} onChange={setEventTime} type="time" />
              <Field label="Lieu" value={location} onChange={setLocation} required />
            </div>
            <Field label="Adresse complète" value={address} onChange={setAddress} placeholder="123 rue de Paris, 75001" />
            <Field label="Description" value={description} onChange={setDescription} rows={3} placeholder="Description de votre événement..." />
            <Field label="Meta description (SEO)" value={metaDescription} onChange={setMetaDescription} rows={2} placeholder="Description pour les moteurs de recherche..." />
          </div>
        </Section>

        {/* ═══════ 2. IMAGES ═══════ */}
        <Section title="Images" icon="🖼️">
          <div className="space-y-4 pt-4">
            <Field
              label="Image Hero (bannière principale)"
              value={heroImage}
              onChange={setHeroImage}
              placeholder="https://... ou collez une URL"
            />
            {heroImage && (
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 h-32">
                <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
              </div>
            )}
            <Field
              label="Image du Welcome Gate (porte d'entrée)"
              value={welcomeImage}
              onChange={setWelcomeImage}
              placeholder="https://... ou collez une URL"
            />
            {welcomeImage && (
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 h-32">
                <img src={welcomeImage} alt="Welcome" className="w-full h-full object-cover" />
              </div>
            )}
            <PhotoUploader
              onPhotosChange={setCoverPhotos}
              existingPhotos={coverPhotos}
              maxPhotos={10}
              label="Photos de couverture / galerie"
            />
          </div>
        </Section>

        {/* ═══════ 3. WELCOME GATE ═══════ */}
        <Section title="Welcome Gate (écran d'accueil)" icon="🚪">
          <div className="space-y-4 pt-4">
            <Field
              label="Message de bienvenue"
              value={welcomeMessage}
              onChange={setWelcomeMessage}
              rows={3}
              placeholder="Nous sommes ravis de vous inviter à célébrer notre union..."
            />
            <Field
              label="Texte d'incitation (sous le message)"
              value={gateHint}
              onChange={setGateHint}
              placeholder="Veuillez saisir votre nom pour découvrir votre invitation personnelle."
            />
          </div>
        </Section>

        {/* ═══════ 4. TEXTE D'INVITATION ═══════ */}
        <Section title="Texte d'invitation" icon="💌">
          <div className="space-y-4 pt-4">
            <Field
              label="Introduction (utilisez {couple} pour insérer les prénoms)"
              value={inviteIntro}
              onChange={setInviteIntro}
              rows={3}
              placeholder="Nous avons la joie de vous inviter au mariage de {couple}..."
            />
            <Field
              label="Texte secondaire"
              value={inviteSecondary}
              onChange={setInviteSecondary}
              rows={3}
              placeholder="Texte supplémentaire..."
            />
            <Field
              label="Texte principal"
              value={mainText}
              onChange={setMainText}
              rows={3}
              placeholder="Texte principal de l'invitation..."
            />
            <Field
              label="Texte du bouton RSVP"
              value={reserveText}
              onChange={setReserveText}
              placeholder="Confirmer ma présence"
            />
            <Field
              label="Date limite RSVP"
              value={rsvpDeadlineText}
              onChange={setRsvpDeadlineText}
              placeholder="Merci de confirmer avant le 15 mars 2026"
            />
          </div>
        </Section>

        {/* ═══════ 5. COULEURS & BRANDING ═══════ */}
        <Section title="Couleurs & Branding" icon="🎨">
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Couleur principale
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Couleur accent
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Couleur bouton RSVP
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={rsvpButtonColor}
                  onChange={(e) => setRsvpButtonColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={rsvpButtonColor}
                  onChange={(e) => setRsvpButtonColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: rsvpButtonColor }}
                >
                  RSVP
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════ 6. SECTION À PROPOS ═══════ */}
        <Section title="Section À propos" icon="💑">
          <div className="space-y-4 pt-4">
            <Field label="Titre de la section" value={aboutTitle} onChange={setAboutTitle} placeholder="À propos de nous" />
            <Field label="Histoire (partie 1)" value={aboutStory1} onChange={setAboutStory1} rows={3} placeholder="Notre histoire a commencé..." />
            <Field label="Histoire (partie 2)" value={aboutStory2} onChange={setAboutStory2} rows={3} placeholder="Le chapitre suivant..." />
            <Field label="Image de couverture À propos" value={aboutImage} onChange={setAboutImage} placeholder="https://..." />
            {aboutImage && (
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 h-32">
                <img src={aboutImage} alt="À propos" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </Section>

        {/* ═══════ 7. PROGRAMME ═══════ */}
        <Section title="Programme de la journée" icon="📅">
          <div className="space-y-4 pt-4">
            <Field
              label="Titre de la section programme"
              value={programSectionTitle}
              onChange={setProgramSectionTitle}
              placeholder="Programme de la journée"
            />
            <ProgramEditor items={program} onChange={setProgram} />
          </div>
        </Section>

        {/* ═══════ 8. LIEU / VENUE ═══════ */}
        <Section title="Lieu & Carte" icon="📍">
          <div className="space-y-4 pt-4">
            <Field label="Nom du lieu" value={venue} onChange={setVenue} placeholder="Château de Versailles" />
            <Field label="Adresse du lieu" value={venueAddress} onChange={setVenueAddress} placeholder="Place d'Armes, 78000 Versailles" />
            <Field label="Lien Google Maps" value={venueMapLink} onChange={setVenueMapLink} placeholder="https://maps.google.com/..." />
            <Field label="Image de la carte" value={venueMapImage} onChange={setVenueMapImage} placeholder="https://... (image de la carte)" />
            {venueMapImage && (
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 h-32">
                <img src={venueMapImage} alt="Carte" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </Section>

        {/* ═══════ 9. DRESS CODE ═══════ */}
        <Section title="Dress Code" icon="👔">
          <div className="space-y-4 pt-4">
            <Field label="Titre du dress code" value={dressCodeTitle} onChange={setDressCodeTitle} placeholder="Tenue élégante" />
            <PhotoUploader
              onPhotosChange={setDressImages}
              existingPhotos={dressImages}
              maxPhotos={8}
              label="Photos d'inspiration tenue"
            />
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={secDressCode}
                  onChange={(e) => setSecDressCode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-rose-300 dark:peer-focus:ring-rose-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-rose-500" />
              </label>
              <span className="text-xs text-gray-700 dark:text-gray-300">Afficher la section Dress Code</span>
            </div>
          </div>
        </Section>

        {/* ═══════ 10. INFOS PRATIQUES ═══════ */}
        <Section title="Informations pratiques" icon="ℹ️">
          <div className="space-y-4 pt-4">
            <Field
              label="Titre de la section"
              value={practicalSectionTitle}
              onChange={setPracticalSectionTitle}
              placeholder="Informations pratiques"
            />
            <PracticalInfoEditor items={practicalInfo} onChange={setPracticalInfo} />
          </div>
        </Section>

        {/* ═══════ 11. MUSIQUE & AMBIANCE ═══════ */}
        <Section title="Musique & Ambiance" icon="🎵">
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={musicEnabled}
                  onChange={(e) => setMusicEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-rose-300 dark:peer-focus:ring-rose-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-rose-500" />
              </label>
              <span className="text-xs text-gray-700 dark:text-gray-300">
                Activer la musique de fond
              </span>
            </div>
            {musicEnabled && (
              <>
                <Field
                  label="URL de la musique (MP3, OGG...)"
                  value={musicUrl}
                  onChange={setMusicUrl}
                  placeholder="https://... ou /audio/music.mp3"
                />
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Volume ({musicVolume}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={musicVolume}
                    onChange={(e) => setMusicVolume(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>
              </>
            )}
          </div>
        </Section>

        {/* ═══════ 12. SECTIONS VISIBLES ═══════ */}
        <Section title="Sections visibles" icon="👁️">
          <div className="space-y-3 pt-4">
            {[
              { label: 'Galerie photos', value: secGallery, setter: setSecGallery },
              { label: 'Compte à rebours', value: secCountdown, setter: setSecCountdown },
              { label: 'Dress Code', value: secDressCode, setter: setSecDressCode },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.value}
                    onChange={(e) => item.setter(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-rose-300 dark:peer-focus:ring-rose-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-rose-500" />
                </label>
                <span className="text-xs text-gray-700 dark:text-gray-300">{item.label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══════ 13. LIENS & CONTACT ═══════ */}
        <Section title="Liens & Contact" icon="🔗">
          <div className="space-y-4 pt-4">
            <Field label="Email de support" value={supportEmail} onChange={setSupportEmail} type="email" placeholder="contact@exemple.com" />
            <Field label="Lien de donation" value={donationLink} onChange={setDonationLink} placeholder="https://..." />
            <Field label="Numéro WhatsApp pour donation" value={whatsappDonation} onChange={setWhatsappDonation} placeholder="+33612345678" />
            <Field label="Message WhatsApp donation" value={whatsappDonationMessage} onChange={setWhatsappDonationMessage} rows={2} placeholder="Bonjour, je souhaite contribuer..." />
          </div>
        </Section>

        {/* ═══════ 14. ADMINISTRATION ═══════ */}
        <Section title="Administration" icon="🔒">
          <div className="space-y-4 pt-4">
            <Field label="Code admin" value={adminCode} onChange={setAdminCode} placeholder="Code secret pour gérer l'événement" />
          </div>
        </Section>

        {/* ═══════ BOUTON SAUVEGARDER ═══════ */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-rose-500 to-blue-500 text-white rounded-2xl font-bold text-base shadow-xl shadow-rose-200/50 dark:shadow-rose-900/30 hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder et voir l\'aperçu'}
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