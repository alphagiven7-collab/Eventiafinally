'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useToast } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import PhotoUploader from '@/components/ui/photo-uploader';
import { Music, Upload, X } from 'lucide-react';
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
  subtitle,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
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
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{icon}</span>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          </div>
          {subtitle && !open && <p className="text-[10px] text-gray-400 dark:text-gray-500 ml-8">{subtitle}</p>}
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
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700">
          {subtitle && <p className="text-[11px] text-gray-400 dark:text-gray-500 italic mb-1 -mx-5 px-5 py-2.5 bg-gray-50/50 dark:bg-gray-700/30">{subtitle}</p>}
          {children}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────
   Composant champ texte réutilisable
   ───────────────────────────────────────────── */
function Field({
  label,
  help,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  rows,
}: {
  label: string;
  help?: string;
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
      {help && <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1.5 leading-relaxed">{help}</p>}
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
   Uploader audio local (base64)
   ───────────────────────────────────────────── */
function AudioUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const fileInputRef = useState<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setFileName(file.name);
      onChange(dataUrl);
    } catch {
      alert("Erreur lors de l'import du fichier audio.");
    }
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="audio/*"
        className="hidden"
        id="audio-upload-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {value ? (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
            <Music className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
              {fileName || 'Fichier audio chargé'}
            </p>
            <audio src={value} controls className="w-full h-8 mt-1" />
          </div>
          <button
            type="button"
            onClick={() => { onChange(''); setFileName(''); }}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor="audio-upload-input"
          className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:border-rose-300 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition"
        >
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-5 h-5 text-rose-500" />
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {uploading ? 'Import en cours...' : 'Touchez pour importer un fichier audio'}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">MP3, OGG, WAV • Max 10 Mo</p>
          </div>
        </label>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Uploader image unique (pour Hero, Welcome, About, Map)
   ───────────────────────────────────────────── */
function SingleImageUploader({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      // @ts-ignore
      const imageCompression = (await import('browser-image-compression')).default;
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.85,
      };
      let result: File | Blob;
      try {
        result = await imageCompression(file, options);
      } catch {
        result = file;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(result);
      });
      onChange(dataUrl);
    } catch {
      alert("Erreur lors de l'import de l'image.");
    }
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      {help && <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1.5 leading-relaxed">{help}</p>}
      {value ? (
        <div className="relative group">
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 h-36">
            <img src={value} alt={label} className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-xl">
            <label className="px-3 py-2 bg-white/90 rounded-lg text-xs font-medium cursor-pointer hover:bg-white transition">
              Changer
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => onChange('')}
              className="px-3 py-2 bg-red-500/90 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition"
            >
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:border-rose-300 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-5 h-5 text-rose-500" />
            )}
          </div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {uploading ? 'Compression en cours...' : 'Touchez pour importer une image'}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">JPG, PNG, HEIC</p>
        </label>
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

  /* ── Chargement de l'événement (local-first, Supabase en arrière-plan) ── */
  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      // 1. TOUJOURS charger les données locales en premier (instantané)
      const localEvt = getEventBySlug(slug);
      if (localEvt && !cancelled) {
        populateFields(localEvt);
      }

      // 2. Charger depuis localStorage si connecté
      if (user?.id && !cancelled) {
        try {
          const userEvts = await getUserEvents(user.id);
          const found = userEvts.find((e) => e.slug === slug);
          if (found && !cancelled) {
            populateFields(found);
          }
        } catch {}
      }

      // Si déjà trouvé localement, arrêter ici (pas besoin de Supabase)
      if (localEvt) return;

      // 3. Essayer Supabase en arrière-plan avec timeout 8s
      if (isSupabaseReady() && !cancelled) {
        try {
          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 8000)
          );
          const fetchPromise = (async () => {
            const supabase = createClient();
            const { data } = await supabase
              .from('events')
              .select('*')
              .eq('slug', slug)
              .single();
            return data;
          })();
          const data = await Promise.race([fetchPromise, timeoutPromise]);
          if (data && !cancelled) {
            populateFields(data as EventWithSettings);
            return;
          }
        } catch {
          // Supabase injoignable ou timeout
        }
      }

      // 4. Rien trouvé → arrêter le loading
      if (!cancelled) {
        setLoading(false);
      }
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
    return () => { cancelled = true; };
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
        {/* ═══════ 1. LES DÉTAILS DE VOTRE ÉVÉNEMENT ═══════ */}
        <Section
          title="Les détails de votre événement"
          subtitle="Commençons par l'essentiel : qui, quand et où !"
          icon="📝"
          defaultOpen
        >
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Nom de votre événement"
                help="Ex: Le mariage de Marie & Pierre"
                value={title}
                onChange={setTitle}
                required
                placeholder="Ex: Le mariage de Marie & Pierre"
              />
              <Field
                label="Petit mot d'accroche"
                help="Une phrase courte qui apparaîtra sous le titre"
                value={subtitle}
                onChange={setSubtitle}
                placeholder="Ex: Célébrons notre amour"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Prénom de la première personne"
                help="Sera affiché à gauche dans l'invitation"
                value={coupleLeft}
                onChange={setCoupleLeft}
                placeholder="Ex: Marie"
              />
              <Field
                label="Prénom de la deuxième personne"
                help="Sera affiché à droite dans l'invitation"
                value={coupleRight}
                onChange={setCoupleRight}
                placeholder="Ex: Pierre"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="Date de l'événement"
                help="Le grand jour !"
                value={eventDate}
                onChange={setEventDate}
                type="date"
                required
              />
              <Field
                label="Heure de début"
                value={eventTime}
                onChange={setEventTime}
                type="time"
              />
              <Field
                label="Ville ou lieu"
                help="Ex: Paris, Château de Versailles..."
                value={location}
                onChange={setLocation}
                required
                placeholder="Ex: Paris"
              />
            </div>
            <Field
              label="Adresse complète"
              help="L'adresse exacte pour que vos invités puissent s'y rendre"
              value={address}
              onChange={setAddress}
              placeholder="Ex: 123 rue de Paris, 75001 Paris"
            />
            <Field
              label="Description de l'événement"
              help="Quelques mots sur votre événement (optionnel)"
              value={description}
              onChange={setDescription}
              rows={3}
              placeholder="Ex: Nous sommes heureux de vous convier à notre célébration..."
            />
            <Field
              label="Description pour Google"
              help="Si vous partagez le lien sur les réseaux, c'est ce texte qui apparaîtra (optionnel)"
              value={metaDescription}
              onChange={setMetaDescription}
              rows={2}
              placeholder="Ex: Le mariage de Marie et Pierre - 15 mars 2026 à Paris"
            />
          </div>
        </Section>

        {/* ═══════ 2. VOS PHOTOS ═══════ */}
        <Section
          title="Vos photos"
          subtitle="Ajoutez les photos qui rendront votre invitation unique"
          icon="📸"
        >
          <div className="space-y-4 pt-4">
            <SingleImageUploader
              label="Photo de couverture (celle en haut)"
              value={heroImage}
              onChange={setHeroImage}
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 -mt-2">
              C'est la grande image que vos invités verront en arrivant sur votre invitation
            </p>
            <SingleImageUploader
              label="Photo d'accueil (avant d'ouvrir l'invitation)"
              value={welcomeImage}
              onChange={setWelcomeImage}
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 -mt-2">
              C'est l'image de fond que vos invités verront avant de saisir leur nom
            </p>
            <PhotoUploader
              onPhotosChange={setCoverPhotos}
              existingPhotos={coverPhotos}
              maxPhotos={10}
              label="Votre galerie de photos"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 -mt-2">
              La première photo sera utilisée comme image de partage sur les réseaux sociaux
            </p>
          </div>
        </Section>

        {/* ═══════ 3. MESSAGE D'ACCUEIL ═══════ */}
        <Section
          title="Message d'accueil"
          subtitle="C'est ce que vos invités verront avant de découvrir l'invitation"
          icon="🚪"
        >
          <div className="space-y-4 pt-4">
            <Field
              label="Votre message de bienvenue"
              help="Écrivez quelques mots chaleureux pour accueillir vos invités"
              value={welcomeMessage}
              onChange={setWelcomeMessage}
              rows={3}
              placeholder="Ex: Nous sommes ravis de vous inviter à célébrer notre union..."
            />
            <Field
              label="Invitation à entrer son nom"
              help="Le texte qui apparaît sous le message pour demander aux invités de saisir leur prénom"
              value={gateHint}
              onChange={setGateHint}
              placeholder="Ex: Entrez votre prénom pour ouvrir votre invitation"
            />
          </div>
        </Section>

        {/* ═══════ 4. CONTENU DE L'INVITATION ═══════ */}
        <Section
          title="Contenu de l'invitation"
          subtitle="Rédigez le texte que vos invités liront sur la carte d'invitation"
          icon="💌"
        >
          <div className="space-y-4 pt-4">
            <Field
              label="Texte d'introduction"
              help="Écrivez le texte qui apparaîtra sur la carte d'invitation. Tapez {'{couple}'} pour insérer automatiquement les prénoms."
              value={inviteIntro}
              onChange={setInviteIntro}
              rows={3}
              placeholder="Ex: Nous avons la joie de vous inviter au mariage de {couple}..."
            />
            <Field
              label="Texte complémentaire"
              help="Un second paragraphe sur la carte (optionnel)"
              value={inviteSecondary}
              onChange={setInviteSecondary}
              rows={3}
              placeholder="Ex: Nous serions honorés de votre présence..."
            />
            <Field
              label="Message personnel"
              help="Un message qui sera affiché sous la carte d'invitation (optionnel)"
              value={mainText}
              onChange={setMainText}
              rows={3}
              placeholder="Ex: Venez célébrer ce moment unique avec nous..."
            />
            <Field
              label="Texte du bouton de confirmation"
              help="Le texte qui apparaît sur le bouton où vos invités confirment leur venue"
              value={reserveText}
              onChange={setReserveText}
              placeholder="Ex: Confirmer ma présence"
            />
            <Field
              label="Date limite pour confirmer"
              help="Indiquez jusqu'à quand vos invités peuvent confirmer leur venue"
              value={rsvpDeadlineText}
              onChange={setRsvpDeadlineText}
              placeholder="Ex: Merci de confirmer avant le 15 mars 2026"
            />
          </div>
        </Section>

        {/* ═══════ 5. LES COULEURS ═══════ */}
        <Section
          title="Les couleurs"
          subtitle="Choisissez les couleurs qui reflètent votre style"
          icon="🎨"
        >
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Couleur dominante
                </label>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1.5">
                  Utilisée pour les titres et les éléments principaux
                </p>
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
                  Couleur secondaire
                </label>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1.5">
                  Utilisée pour les accents et les détails
                </p>
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
                Couleur du bouton « Confirmer sa venue »
              </label>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1.5">
                C'est le bouton sur lequel vos invités cliqueront pour confirmer leur présence
              </p>
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
                  OK
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════ 6. NOTRE HISTOIRE ═══════ */}
        <Section
          title="Notre histoire"
          subtitle="Racontez votre parcours à vos invités (optionnel)"
          icon="💑"
        >
          <div className="space-y-4 pt-4">
            <Field
              label="Titre de cette section"
              help="Ex: Comment tout a commencé..."
              value={aboutTitle}
              onChange={setAboutTitle}
              placeholder="Ex: Notre histoire"
            />
            <Field
              label="Comment vous vous êtes rencontrés"
              help="Racontez les débuts de votre histoire"
              value={aboutStory1}
              onChange={setAboutStory1}
              rows={3}
              placeholder="Ex: Tout a commencé un soir d'été..."
            />
            <Field
              label="La suite de votre histoire"
              help="Le chapitre suivant (la demande, les projets...)"
              value={aboutStory2}
              onChange={setAboutStory2}
              rows={3}
              placeholder="Ex: Et puis un jour, la demande en mariage..."
            />
            <SingleImageUploader
              label="Photo pour illustrer votre histoire"
              value={aboutImage}
              onChange={setAboutImage}
            />
          </div>
        </Section>

        {/* ═══════ 7. DÉROULÉ DE LA JOURNÉE ═══════ */}
        <Section
          title="Déroulé de la journée"
          subtitle="Indiquez à vos invités comment se passera la journée"
          icon="📅"
        >
          <div className="space-y-4 pt-4">
            <Field
              label="Titre de cette section"
              help="Ex: Le programme, Déroulé de la journée..."
              value={programSectionTitle}
              onChange={setProgramSectionTitle}
              placeholder="Ex: Déroulé de la journée"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              Ajoutez chaque étape avec l'heure et une courte description (ex: 14h - Cérémonie)
            </p>
            <ProgramEditor items={program} onChange={setProgram} />
          </div>
        </Section>

        {/* ═══════ 8. OÙ ÇA SE PASSE ? ═══════ */}
        <Section
          title="Où ça se passe ?"
          subtitle="Aidez vos invités à trouver le lieu de l'événement"
          icon="📍"
        >
          <div className="space-y-4 pt-4">
            <Field
              label="Nom du lieu"
              help="Ex: Château de Versailles, Mairie du 8ème, Salle des fêtes..."
              value={venue}
              onChange={setVenue}
              placeholder="Ex: Château de Versailles"
            />
            <Field
              label="Adresse complète"
              help="L'adresse exacte pour le GPS de vos invités"
              value={venueAddress}
              onChange={setVenueAddress}
              placeholder="Ex: Place d'Armes, 78000 Versailles"
            />
            <Field
              label="Lien vers la carte (Google Maps)"
              help="Collez ici le lien Google Maps pour que vos invités puissent s'y rendre facilement"
              value={venueMapLink}
              onChange={setVenueMapLink}
              placeholder="Ex: https://maps.google.com/..."
            />
            <SingleImageUploader
              label="Photo ou image du lieu"
              help="Une photo du lieu ou une capture de carte"
              value={venueMapImage}
              onChange={setVenueMapImage}
            />
          </div>
        </Section>

        {/* ═══════ 9. TENUE VESTIMENTAIRE ═══════ */}
        <Section
          title="Tenue vestimentaire"
          subtitle="Indiquez à vos invités comment s'habiller (optionnel)"
          icon="👔"
        >
          <div className="space-y-4 pt-4">
            <Field
              label="Quelle tenue pour votre événement ?"
              help="Ex: Tenue élégante, Tenue de soirée, Chic et décontracté..."
              value={dressCodeTitle}
              onChange={setDressCodeTitle}
              placeholder="Ex: Tenue élégante"
            />
            <PhotoUploader
              onPhotosChange={setDressImages}
              existingPhotos={dressImages}
              maxPhotos={8}
              label="Photos d'inspiration pour la tenue"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 -mt-2">
              Ajoutez des photos pour donner des idées à vos invités
            </p>
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
              <span className="text-xs text-gray-700 dark:text-gray-300">Afficher cette section sur l'invitation</span>
            </div>
          </div>
        </Section>

        {/* ═══════ 10. INFOS UTILES ═══════ */}
        <Section
          title="Infos utiles pour vos invités"
          subtitle="Parking, hébergement, bar... tout ce qu'ils doivent savoir"
          icon="ℹ️"
        >
          <div className="space-y-4 pt-4">
            <Field
              label="Titre de cette section"
              help="Ex: Bon à savoir, Infos pratiques..."
              value={practicalSectionTitle}
              onChange={setPracticalSectionTitle}
              placeholder="Ex: Informations pratiques"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              Ajoutez les infos utiles pour vos invités (parking, hébergement, bar...)
            </p>
            <PracticalInfoEditor items={practicalInfo} onChange={setPracticalInfo} />
          </div>
        </Section>

        {/* ═══════ 11. MUSIQUE ═══════ */}
        <Section
          title="Musique d'ambiance"
          subtitle="Ajoutez une musique qui joue quand vos invités ouvrent l'invitation (optionnel)"
          icon="🎵"
        >
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
                Oui, je veux une musique de fond
              </span>
            </div>
            {musicEnabled && (
              <>
                <AudioUploader value={musicUrl} onChange={setMusicUrl} />
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Volume ({musicVolume}%)
                  </label>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1.5">
                    Réglez le volume pour que la musique soit agréable sans gêner la lecture
                  </p>
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

        {/* ═══════ 12. PAGES À AFFICHER ═══════ */}
        <Section
          title="Pages à afficher"
          subtitle="Choisissez quelles sections vos invités verront sur l'invitation"
          icon="👁️"
        >
          <div className="space-y-3 pt-4">
            {[
              { label: 'La galerie de photos', value: secGallery, setter: setSecGallery },
              { label: 'Le compte à rebours avant le jour J', value: secCountdown, setter: setSecCountdown },
              { label: 'Les indications sur la tenue', value: secDressCode, setter: setSecDressCode },
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

        {/* ═══════ 13. CONTACT & LIENS ═══════ */}
        <Section
          title="Contact et liens utiles"
          subtitle="Comment vos invités peuvent vous joindre ou contribuer (optionnel)"
          icon="📩"
        >
          <div className="space-y-4 pt-4">
            <Field
              label="Votre email de contact"
              help="Les invités pourront vous envoyer un email depuis l'invitation"
              value={supportEmail}
              onChange={setSupportEmail}
              type="email"
              placeholder="Ex: marie.pierre@email.com"
            />
            <Field
              label="Lien pour offrir un cadeau"
              help="Si vous avez une cagnotte en ligne, collez le lien ici"
              value={donationLink}
              onChange={setDonationLink}
              placeholder="Ex: https://www.cagnotte.com/..."
            />
            <Field
              label="Numéro WhatsApp pour le cadeau"
              help="Pour que vos invités puissent envoyer un message WhatsApp"
              value={whatsappDonation}
              onChange={setWhatsappDonation}
              placeholder="Ex: +33612345678"
            />
            <Field
              label="Message WhatsApp pré-rempli"
              help="Le message que vos invités verront quand ils ouvriront WhatsApp"
              value={whatsappDonationMessage}
              onChange={setWhatsappDonationMessage}
              rows={2}
              placeholder="Ex: Bonjour ! Je souhaite contribuer au cadeau de mariage..."
            />
          </div>
        </Section>

        {/* ═══════ 14. SÉCURITÉ ═══════ */}
        <Section
          title="Sécurité de votre événement"
          subtitle="Protégez l'accès à votre événement"
          icon="🔒"
        >
          <div className="space-y-4 pt-4">
            <Field
              label="Mot de passe de l'événement"
              help="Un code secret pour que vous seul puissiez modifier cet événement. Ne partagez ce code avec personne."
              value={adminCode}
              onChange={setAdminCode}
              placeholder="Ex: mon-code-secret-2026"
            />
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