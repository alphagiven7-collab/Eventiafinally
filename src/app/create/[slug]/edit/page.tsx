'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui';
import { useAuth, SUPABASE_REQUIRED } from '@/providers/auth-provider';
import PhotoUploader from '@/components/ui/photo-uploader';
import InvitationExperience from '@/components/invitation/InvitationExperience';
import { compressImageFile, formatDataUrlSize, shrinkDataUrl, slimImageList } from '@/lib/utils/image-compression';
import {
  Music,
  Upload,
  X,
  Eye,
  EyeOff,
  Share2,
  ArrowLeft,
  ExternalLink,
  Check,
  Heart,
  Mail,
  Camera,
  Calendar,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  EventWithSettings,
  ProgramItem,
  PracticalInfoItem,
} from '@/types';
import { getEventBySlug } from '@/data/events';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { fetchInvitationBySlug, publishInvitation } from '@/lib/events/store';
import { clearCreationDraft, readCreationDraft, writeCreationDraft } from '@/lib/drafts/local-draft';

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
  icon: React.ReactNode;
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
            <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
              {icon}
            </span>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          </div>
          {subtitle && !open && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 ml-9">{subtitle}</p>
          )}
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
          {subtitle && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 italic mb-2 -mx-5 px-5 py-2.5 bg-gray-50/50 dark:bg-gray-700/30">
              {subtitle}
            </p>
          )}
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
      {help && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1.5 leading-relaxed">
          {help}
        </p>
      )}
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
   Uploader audio local
   ───────────────────────────────────────────── */
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

function AudioUploader({
  value,
  saved,
  onChange,
  onClear,
}: {
  value: string;
  saved?: boolean;
  onChange: (dataUrl: string) => void;
  onClear?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    const audioName = /\.(mp3|m4a|aac|wav|ogg|mp4|webm)$/i.test(file.name);
    const audioType = file.type.startsWith('audio/') || file.type === 'video/mp4';
    if (!audioName && !audioType) {
      setError('Choisissez un fichier MP3, M4A ou WAV.');
      return;
    }
    if (file.size <= 0) {
      setError('Ce morceau est protégé. Choisissez un fichier MP3 dans Fichiers.');
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      const mega = (file.size / (1024 * 1024)).toFixed(1).replace('.', ',');
      setError(`Ce fichier fait ${mega} Mo. L'invitation accepte une musique jusqu'à 5 Mo.`);
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string' && reader.result.startsWith('data:')) resolve(reader.result);
          else reject(new Error('empty'));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      setFileName(file.name);
      onChange(dataUrl);
    } catch {
      setError('La lecture du fichier a échoué. Réessayez avec un MP3.');
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      {value || saved ? (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 min-w-0">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <Music className="w-5 h-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
              {fileName || (saved && !value ? 'Musique enregistrée' : 'Musique importée')}
            </p>
            {value ? (
              <audio src={value} controls className="w-full max-w-full h-8 mt-1" />
            ) : (
              <p className="text-[10px] text-gray-400 mt-1">Elle démarre quand on ouvre l&apos;invitation.</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onChange('');
              onClear?.();
              setFileName('');
              setError('');
            }}
            className="p-2 text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition"
            aria-label="Retirer la musique"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="relative block w-full cursor-pointer">
          <input
            ref={inputRef}
            type="file"
            accept=".mp3,.m4a,.aac,.wav,.ogg,.mp4,.webm,audio/*"
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <span className="flex items-center gap-3 p-4 border-2 border-dashed border-violet-300 dark:border-violet-700 rounded-xl text-left">
            <span className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
              {uploading ? (
                <span className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              )}
            </span>
            <span>
              <span className="block text-xs font-semibold text-gray-800 dark:text-gray-100">
                {uploading ? 'Import en cours...' : 'Importer une musique'}
              </span>
              <span className="block text-[10px] text-gray-400 dark:text-gray-500">
                MP3, M4A ou WAV, 5 Mo maximum. Un titre protégé du téléphone ne peut pas être lu.
              </span>
            </span>
          </span>
        </label>
      )}
      {error && <p className="text-xs text-violet-700 dark:text-violet-300">{error}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Uploader image unique avec réduction & conversion automatique
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const dataUrl = await compressImageFile(file, {
        maxWidthOrHeight: 900,
        quality: 0.7,
        maxBytes: 80 * 1024,
      });
      onChange(dataUrl);
    } catch {
      alert("Erreur lors de l'import de l'image.");
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const sizeInfo = formatDataUrlSize(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {sizeInfo && (
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Prête ({sizeInfo})
          </span>
        )}
      </div>
      {help && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
          {help}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {value ? (
        <div className="space-y-2">
          <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 h-40 bg-gray-100 dark:bg-gray-800">
            <img src={value} alt={label} className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-medium transition"
            >
              {uploading ? 'Conversion...' : 'Changer la photo'}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="py-2 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium transition"
            >
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center gap-2 p-5 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:border-rose-300 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            )}
          </div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {uploading ? 'On prépare la photo...' : 'Touchez pour ajouter une photo'}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            Elle s&apos;affiche plus vite une fois prête
          </p>
        </button>
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
    <div className="space-y-2.5 mt-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex gap-2 items-center p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600"
        >
          <input
            type="text"
            value={item.time}
            onChange={(e) => updateItem(i, 'time', e.target.value)}
            placeholder="16h00"
            className="w-20 px-2.5 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <input
            type="text"
            value={item.title}
            onChange={(e) => updateItem(i, 'title', e.target.value)}
            placeholder="Cérémonie, cocktail, dîner"
            className="flex-1 px-2.5 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <select
            value={item.color}
            onChange={(e) => updateItem(i, 'color', e.target.value)}
            className="px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="pink">Rose</option>
            <option value="blue">Bleu</option>
            <option value="green">Vert</option>
            <option value="purple">Violet</option>
          </select>
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
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
        + Ajouter un moment
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
    <div className="space-y-2.5 mt-2">
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
              <option value="car">Accès / Parking</option>
              <option value="bed">Hébergement</option>
              <option value="wine">Réception</option>
            </select>
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(i, 'title', e.target.value)}
              placeholder="Parking gratuit"
              className="flex-1 px-2.5 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            >
              ✕
            </button>
          </div>
          <textarea
            value={item.text}
            onChange={(e) => updateItem(i, 'text', e.target.value)}
            placeholder="Où se garer, où dormir, ce qu'il faut savoir"
            rows={2}
            className="w-full px-2.5 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
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

/* ─────────────────────────────────────────────
   Palettes d'harmonies rapides
   ───────────────────────────────────────────── */
const COLOR_PRESETS = [
  { name: 'Mauve & Bleu', primary: '#5b21b6', accent: '#2563eb', rsvp: '#7c3aed' },
  { name: 'Or & Champagne', primary: '#b45309', accent: '#92400e', rsvp: '#d97706' },
  { name: 'Sauge & Émeraude', primary: '#047857', accent: '#065f46', rsvp: '#10b981' },
  { name: 'Bleu Nuit & Royal', primary: '#1d4ed8', accent: '#1e40af', rsvp: '#2563eb' },
  { name: 'Terracotta & Figue', primary: '#c2410c', accent: '#9a3412', rsvp: '#ea580c' },
];

/* ═══════════════════════════════════════════════
   PAGE PRINCIPALE
   ═══════════════════════════════════════════════ */
function EditEventContent() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventWithSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const onTheme = (themeEvent: Event) => {
      const next = (themeEvent as CustomEvent<string>).detail;
      if (next === 'dark' || next === 'light') setTheme(next);
    };
    window.addEventListener('invitia-theme-change', onTheme);
    return () => window.removeEventListener('invitia-theme-change', onTheme);
  }, [setTheme]);

  // ── 1. L'essentiel (Qui, Quand, Où) ──
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [coupleLeft, setCoupleLeft] = useState('');
  const [coupleRight, setCoupleRight] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [mapLink, setMapLink] = useState('');
  const [venueMapImage, setVenueMapImage] = useState('');

  // ── 2. Texte de la carte & Couleurs ──
  const [inviteIntro, setInviteIntro] = useState('');
  const [inviteSecondary, setInviteSecondary] = useState('');
  const [mainText, setMainText] = useState('');
  const [reserveText, setReserveText] = useState('');
  const [rsvpDeadlineText, setRsvpDeadlineText] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#5b21b6');
  const [accentColor, setAccentColor] = useState('#2563eb');
  const [rsvpButtonColor, setRsvpButtonColor] = useState('#7c3aed');

  // ── 3. Photos & Musique ──
  const [heroImage, setHeroImage] = useState('');
  const [coverPhotos, setCoverPhotos] = useState<string[]>([]);
  const [secGallery, setSecGallery] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicUrl, setMusicUrl] = useState('');
  const [musicHasFile, setMusicHasFile] = useState(false);
  const [musicVolume, setMusicVolume] = useState(35);

  // ── 4. Programme, Tenue & Infos ──
  const [secCountdown, setSecCountdown] = useState(true);
  const [programSectionTitle, setProgramSectionTitle] = useState('');
  const [program, setProgram] = useState<ProgramItem[]>([]);
  const [drinks, setDrinks] = useState<{ id: string; name: string; desc: string; emoji: string }[]>([]);
  const [secDressCode, setSecDressCode] = useState(true);
  const [dressCodeTitle, setDressCodeTitle] = useState('');
  const [dressImages, setDressImages] = useState<string[]>([]);
  const [practicalSectionTitle, setPracticalSectionTitle] = useState('');
  const [practicalInfo, setPracticalInfo] = useState<PracticalInfoItem[]>([]);

  // ── 5. Notre histoire & Contact (optionnels) ──
  const [aboutTitle, setAboutTitle] = useState('');
  const [aboutStory1, setAboutStory1] = useState('');
  const [aboutStory2, setAboutStory2] = useState('');
  const [aboutImage, setAboutImage] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [donationLink, setDonationLink] = useState('');
  const [whatsappDonation, setWhatsappDonation] = useState('');
  const [whatsappDonationMessage, setWhatsappDonationMessage] = useState('');
  const [invitationTemplate, setInvitationTemplate] = useState<'elegance' | 'motifs'>('elegance');
  const [groomMotifImage, setGroomMotifImage] = useState('');
  const [brideMotifImage, setBrideMotifImage] = useState('');
  const [rsvpDeadline, setRsvpDeadline] = useState('');
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [leaveAsk, setLeaveAsk] = useState(false);
  const [blocked, setBlocked] = useState(false);

  /* ── Chargement de l'événement ── */
  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      const draft = await readCreationDraft();
      const sameDraft = draft && draft.slug === slug ? draft : null;

      if (isSupabaseReady() && user?.id) {
        try {
          const hosted = await fetchInvitationBySlug(createClient(), slug, { includeMusic: false });
          if (cancelled) return;
          if (hosted && hosted.user_id && hosted.user_id !== user.id) {
            setBlocked(true);
            setLoading(false);
            return;
          }
          if (sameDraft && (!hosted || sameDraft.savedAt >= (hosted?.updated_at || ''))) {
            const attached = await publishInvitation(createClient(), {
              ...sameDraft.event,
              user_id: user.id,
              is_published: hosted?.is_published ?? false,
            });
            if (!attached.error) {
              await clearCreationDraft();
              const fresh = await fetchInvitationBySlug(createClient(), slug, { includeMusic: false });
              if (fresh && !cancelled) {
                populateFields(fresh);
                addToast('success', 'Votre brouillon est rattaché à votre compte.');
                return;
              }
            }
          }
          if (hosted) {
            if (sameDraft) await clearCreationDraft();
            populateFields(hosted);
            return;
          }
        } catch {
          // Le brouillon local reste disponible.
        }
      }

      if (sameDraft && !cancelled) {
        populateFields(sameDraft.event);
        return;
      }

      if (user?.id) {
        const demo = getEventBySlug(slug);
        if (demo && !cancelled) {
          populateFields(demo);
          return;
        }
      }

      if (!cancelled) setLoading(false);
    }

    function populateFields(evt: EventWithSettings) {
      setEvent(evt);
      setTitle(evt.title || '');
      setSubtitle(evt.subtitle || '');
      setCoupleLeft(evt.coupleLeft || '');
      setCoupleRight(evt.coupleRight || '');
      setEventDate(evt.event_date ? new Date(evt.event_date).toISOString().split('T')[0] : '');
      setEventTime(evt.event_time || '');
      setLocation(evt.venue || evt.location || '');
      setAddress(evt.venueDetails?.address || evt.address || '');
      setMapLink(evt.links?.map || evt.mapLink || '');
      setVenueMapImage(evt.venueDetails?.mapImage || evt.mapImage || '');

      setHeroImage(evt.heroImage || evt.hero_image || evt.branding?.heroImage || '');
      setCoverPhotos(evt.bestPhotos || (evt.cover_image ? [evt.cover_image] : []));
      setInviteIntro(evt.inviteIntro || '');
      setInviteSecondary(evt.inviteSecondary || '');
      setMainText(evt.mainText || '');
      setReserveText(evt.reserveText || '');
      setRsvpDeadlineText(evt.rsvpDeadlineText || '');

      setPrimaryColor(evt.branding?.primaryColor || '#5b21b6');
      setAccentColor(evt.branding?.accentColor || '#2563eb');
      setRsvpButtonColor(evt.rsvpButtonColor || '#7c3aed');

      setAboutTitle(evt.aboutTitle || '');
      setAboutStory1(evt.aboutStory1 || '');
      setAboutStory2(evt.aboutStory2 || '');
      setAboutImage(evt.aboutImage || '');

      setProgramSectionTitle(evt.programSectionTitle || '');
      setProgram(evt.program || []);
      setDrinks(evt.drinks || []);
      setDressCodeTitle(evt.dressCodeTitle || '');
      setDressImages(evt.dressImages || []);
      setPracticalSectionTitle(evt.practicalSectionTitle || '');
      setPracticalInfo(evt.practicalInfo || []);

      setMusicEnabled(evt.ambiance?.enabled || false);
      setMusicUrl(evt.ambiance?.musicUrl || '');
      setMusicHasFile(Boolean(evt.ambiance?.hasFile) || (evt.ambiance?.musicUrl || '').startsWith('data:'));
      setMusicVolume(Math.round((evt.ambiance?.volume || 0.35) * 100));

      setSupportEmail(evt.links?.supportEmail || evt.supportEmail || '');
      setDonationLink(evt.links?.donation || '');
      setWhatsappDonation(evt.links?.whatsappDonation || evt.whatsappDonationPhone || '');
      setWhatsappDonationMessage(evt.links?.donationWhatsAppMessage || '');

      setInvitationTemplate(evt.invitationTemplate === 'motifs' ? 'motifs' : 'elegance');
      setGroomMotifImage(evt.groomMotifImage || '');
      setBrideMotifImage(evt.brideMotifImage || '');
      setRsvpDeadline(evt.rsvpDeadline ? evt.rsvpDeadline.slice(0, 10) : '');
      setSecGallery(evt.sections?.gallery !== false);
      setSecCountdown(evt.sections?.countdown !== false);
      setSecDressCode(evt.sections?.dressCode !== false);
      setLoading(false);
    }

    loadEvent();
    return () => {
      cancelled = true;
    };
  }, [slug, user?.id, addToast]);

  /* ── Objet événement construit en direct (pour l'aperçu ET la sauvegarde) ── */
  const liveEvent = useMemo<EventWithSettings | null>(() => {
    if (!event) return null;
    const primaryCover = heroImage || coverPhotos[0] || event.cover_image || '';
    const autoTitle =
      coupleLeft.trim() && coupleRight.trim()
        ? `Mariage de ${coupleLeft.trim()} & ${coupleRight.trim()}`
        : title.trim() || coupleLeft.trim() || coupleRight.trim() || event.title || 'Votre événement';
    return {
      ...event,
      title: autoTitle,
      subtitle: subtitle || undefined,
      coupleLeft: coupleLeft || undefined,
      coupleRight: coupleRight || undefined,
      event_date: eventDate ? new Date(eventDate).toISOString() : event.event_date,
      event_time: eventTime || undefined,
      location: location || 'Lieu de réception',
      venue: location || undefined,
      address: address || undefined,
      cover_image: primaryCover,
      hero_image: primaryCover || undefined,
      heroImage: primaryCover || undefined,
      bestPhotos: coverPhotos,
      inviteIntro: inviteIntro || undefined,
      inviteSecondary: undefined,
      mainText: undefined,
      reserveText: undefined,
      rsvpDeadlineText: rsvpDeadlineText || undefined,
      rsvpButtonColor: rsvpButtonColor || undefined,
      branding: {
        primaryColor,
        accentColor,
        heroImage: primaryCover,
        welcomeImage: primaryCover,
        ogShareImage: primaryCover,
      },
      aboutTitle: undefined,
      aboutStory1: aboutStory1 || undefined,
      aboutStory2: undefined,
      aboutImage: aboutImage || undefined,
      programSectionTitle: undefined,
      program: program.length > 0 ? program : undefined,
      drinks: drinks.filter((drink) => drink.name.trim()).length > 0 ? drinks.filter((drink) => drink.name.trim()) : undefined,
      venueDetails: {
        title: location || 'Lieu de réception',
        address: address || '',
        lat: '',
        lng: '',
        mapImage: venueMapImage || '',
      },
      dressCodeTitle: dressCodeTitle || undefined,
      dressImages: dressImages.length > 0 ? dressImages : undefined,
      practicalSectionTitle: undefined,
      practicalInfo: practicalInfo.length > 0 ? practicalInfo : undefined,
      ambiance: {
        enabled: musicEnabled,
        musicUrl,
        volume: musicVolume / 100,
        hasFile: musicHasFile || musicUrl.startsWith('data:'),
      },
      links: {
        map: mapLink || undefined,
        supportEmail: supportEmail || undefined,
        donation: donationLink || undefined,
        whatsappDonation: whatsappDonation || undefined,
        donationWhatsAppMessage: undefined,
      },
      supportEmail: supportEmail || undefined,
      mapLink: mapLink || undefined,
      sections: {
        gallery: secGallery,
        countdown: secCountdown,
        dressCode: secDressCode,
        quiz: event.sections?.quiz || false,
        donation: Boolean(donationLink || whatsappDonation),
        guestbook: event.sections?.guestbook || false,
      },
      invitationTemplate,
      groomMotifImage: groomMotifImage || undefined,
      brideMotifImage: brideMotifImage || undefined,
      rsvpDeadline: rsvpDeadline || undefined,
      guestLimit: event.guestLimit ?? 3,
      guestPack: event.guestPack,
    };
  }, [
    event,
    title,
    subtitle,
    coupleLeft,
    coupleRight,
    eventDate,
    eventTime,
    location,
    address,
    mapLink,
    venueMapImage,
    heroImage,
    coverPhotos,
    inviteIntro,
    rsvpDeadlineText,
    rsvpButtonColor,
    primaryColor,
    accentColor,
    aboutStory1,
    aboutImage,
    program,
    drinks,
    dressCodeTitle,
    dressImages,
    practicalInfo,
    musicEnabled,
    musicUrl,
    musicHasFile,
    musicVolume,
    supportEmail,
    donationLink,
    whatsappDonation,
    secGallery,
    secCountdown,
    secDressCode,
    invitationTemplate,
    groomMotifImage,
    brideMotifImage,
    rsvpDeadline,
  ]);

  useEffect(() => {
    if (user?.id || !liveEvent) return;
    const handle = window.setTimeout(() => {
      void writeCreationDraft({
        slug: liveEvent.slug,
        event: { ...liveEvent, updated_at: new Date().toISOString() },
        savedAt: new Date().toISOString(),
      });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [user?.id, liveEvent]);

  /* ── Sauvegarde sur Supabase ── */
  const handleSave = useCallback(
    async (mode: 'draft' | 'preview' | 'publish' = 'draft') => {
      if (!liveEvent) return false;
      if (!user?.id) {
        await writeCreationDraft({
          slug: liveEvent.slug,
          event: { ...liveEvent, updated_at: new Date().toISOString() },
          savedAt: new Date().toISOString(),
        });
        if (mode === 'preview') {
          setShowMobilePreview(true);
          addToast('success', 'Aperçu disponible sur cet appareil.');
          return true;
        }
        if (!eventDate || !location.trim()) {
          addToast('error', 'La date et le lieu sont obligatoires.');
          return false;
        }
        router.push(`/auth/register?redirect=${encodeURIComponent(`/create/${liveEvent.slug}/edit`)}`);
        addToast('success', 'Vos informations sont conservées. Créez un compte pour enregistrer l’invitation.');
        return false;
      }
      if (!eventDate || !location.trim()) {
        addToast('error', 'La date et le lieu sont obligatoires.');
        return false;
      }
      if (!isSupabaseReady()) {
        addToast('error', SUPABASE_REQUIRED);
        return false;
      }

      setSaving(true);
      const hero = liveEvent.heroImage ? await shrinkDataUrl(liveEvent.heroImage, 90 * 1024) : liveEvent.heroImage;
      const about = liveEvent.aboutImage ? await shrinkDataUrl(liveEvent.aboutImage, 80 * 1024) : liveEvent.aboutImage;
      const rawMap = liveEvent.venueDetails?.mapImage || liveEvent.mapImage || '';
      const map = rawMap ? await shrinkDataUrl(rawMap, 80 * 1024) : rawMap;
      const cover = liveEvent.cover_image?.startsWith('data:')
        ? await shrinkDataUrl(liveEvent.cover_image, 90 * 1024)
        : liveEvent.cover_image;
      const welcome = liveEvent.branding?.welcomeImage?.startsWith('data:')
        ? await shrinkDataUrl(liveEvent.branding.welcomeImage, 90 * 1024)
        : liveEvent.branding?.welcomeImage;
      const ogImage = liveEvent.branding?.ogShareImage?.startsWith('data:')
        ? await shrinkDataUrl(liveEvent.branding.ogShareImage, 90 * 1024)
        : liveEvent.branding?.ogShareImage;
      const groom = liveEvent.groomMotifImage?.startsWith('data:')
        ? await shrinkDataUrl(liveEvent.groomMotifImage, 80 * 1024)
        : liveEvent.groomMotifImage;
      const bride = liveEvent.brideMotifImage?.startsWith('data:')
        ? await shrinkDataUrl(liveEvent.brideMotifImage, 80 * 1024)
        : liveEvent.brideMotifImage;
      const prepared: EventWithSettings = {
        ...liveEvent,
        user_id: liveEvent.user_id || user.id,
        is_published: mode === 'publish' ? true : mode === 'draft' ? false : Boolean(liveEvent.is_published),
        updated_at: new Date().toISOString(),
        heroImage: hero,
        hero_image: hero,
        aboutImage: about,
        mapImage: map,
        cover_image: cover,
        groomMotifImage: groom || undefined,
        brideMotifImage: bride || undefined,
        bestPhotos: await slimImageList(liveEvent.bestPhotos),
        dressImages: await slimImageList(liveEvent.dressImages),
        branding: liveEvent.branding
          ? {
              ...liveEvent.branding,
              heroImage: hero || liveEvent.branding.heroImage,
              welcomeImage: welcome || liveEvent.branding.welcomeImage,
              ogShareImage: ogImage || liveEvent.branding.ogShareImage,
            }
          : liveEvent.branding,
        venueDetails: liveEvent.venueDetails
          ? { ...liveEvent.venueDetails, mapImage: map }
          : liveEvent.venueDetails,
      };
      const result = await publishInvitation(createClient(), prepared);
      setSaving(false);

      if (result.error) {
        addToast('error', result.error);
        return false;
      }

      setEvent(prepared);
      setConfirmPublish(false);
      if (mode === 'publish') {
        addToast('success', 'Invitation publiée.');
        router.push(`/e/${liveEvent.slug}`);
        return true;
      }
      if (mode === 'preview') {
        addToast('success', 'Aperçu enregistré. La publication n’a pas changé.');
        window.open(`/e/${liveEvent.slug}`, '_blank', 'noopener');
        return true;
      }
      addToast('success', 'Brouillon enregistré.');
      return true;
    },
    [liveEvent, eventDate, location, user?.id, addToast, router]
  );

  /* ── Partage du lien public réel ── */
  const handleShare = useCallback(async () => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://eventiafinally.vercel.app';
    const publicUrl = `${origin}/e/${event?.slug || slug}`;
    const shareText = `Tu es invité(e) à "${title || event?.title}" !`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: title || event?.title || 'Invitation',
          text: shareText,
          url: publicUrl,
        });
        return;
      } catch {
        // Repli copie / WhatsApp
      }
    }

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      addToast('success', 'Lien de l’invitation copié !');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${publicUrl}`)}`, '_blank', 'noopener');
    }
  }, [event?.slug, event?.title, slug, title, addToast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="text-center max-w-sm">
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Cette invitation n&apos;est pas la vôtre.</p>
          <button type="button" onClick={() => router.push('/dashboard')} className="mt-4 text-violet-700 dark:text-violet-300 hover:underline">
            Retour à mes événements
          </button>
        </div>
      </div>
    );
  }

  if (!event || !liveEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-xl text-gray-500 dark:text-gray-400">On ne trouve pas cette invitation</p>
          <button
            type="button"
            onClick={() => router.push(user ? '/dashboard' : '/create')}
            className="mt-4 text-violet-700 dark:text-violet-300 hover:underline"
          >
            {user ? 'Retour aux événements' : 'Créer une invitation'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-rose-50/70 via-white to-slate-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans transition-colors">
      {/* Header sticky */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-rose-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setLeaveAsk(true)}
              className="inline-flex w-full sm:w-auto min-h-11 items-center justify-center gap-2 px-4 py-2 rounded-xl border border-violet-300 bg-white text-violet-700 text-sm font-semibold hover:bg-violet-50 dark:bg-gray-900 dark:text-violet-200 dark:border-violet-700"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              Retour aux événements
            </button>
            <button
              type="button"
              onClick={() => setConfirmPublish(true)}
              disabled={saving}
              className="inline-flex w-full sm:w-auto min-h-11 items-center justify-center px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50"
            >
              Publier l'invitation
            </button>
          </div>
          <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
            {user
              ? 'Tant que c’est un brouillon, le lien ne s’ouvre que sur cet appareil. Publiez pour que les autres puissent le voir.'
              : 'Vous pouvez préparer la carte sans compte. Pour l’enregistrer ou la publier, créez un compte. Le brouillon reste ici.'}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
              {title || event.title}
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {event.is_published ? 'Publiée' : 'Brouillon'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = resolvedTheme === 'dark' ? 'light' : 'dark';
                setTheme(next);
                try {
                  localStorage.setItem('invitia_theme', next);
                  localStorage.setItem('theme', next);
                } catch {}
                window.dispatchEvent(new CustomEvent('invitia-theme-change', { detail: next }));
              }}
              className="p-2 border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-300 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
              title="Basculer le mode sombre"
              aria-label="Basculer le mode sombre"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setShowMobilePreview((v) => !v)}
              className="lg:hidden px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-medium flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              {showMobilePreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showMobilePreview ? 'Modifier' : 'Aperçu'}</span>
            </button>
            <a
              href={`/e/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Voir l’invitation</span>
            </a>
            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-2 border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-medium flex items-center gap-1.5 hover:bg-emerald-100 transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Lien copié' : 'Partager'}</span>
            </button>
          </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-w-0">
        {/* Colonne de gauche : les 5 sections de personnalisation */}
        <main
          className={`lg:col-span-7 space-y-4 ${
            showMobilePreview ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* ═══════ 1. L'ESSENTIEL (QUI, QUAND, OÙ) ═══════ */}
          <Section
            title="1. Qui, quand, où"
            subtitle="Les prénoms, le jour et le lieu. C’est ce que tout le monde cherche en premier."
            icon={<Heart className="w-4 h-4" />}
            defaultOpen
          >
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Premier prénom"
                  value={coupleLeft}
                  onChange={setCoupleLeft}
                  required
                  placeholder="Marie"
                />
                <Field
                  label="Deuxième prénom"
                  value={coupleRight}
                  onChange={setCoupleRight}
                  placeholder="Pierre"
                />
              </div>
              <Field
                label="Une phrase sous les prénoms"
                value={subtitle}
                onChange={setSubtitle}
                placeholder="On vous attend"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Le jour"
                  value={eventDate}
                  onChange={setEventDate}
                  type="date"
                  required
                />
                <Field
                  label="L'heure"
                  value={eventTime}
                  onChange={setEventTime}
                  placeholder="16h00"
                />
              </div>
              <Field
                label="Jusqu'à quand répondre"
                value={rsvpDeadline}
                onChange={setRsvpDeadline}
                type="date"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Le lieu"
                  value={location}
                  onChange={setLocation}
                  required
                  placeholder="Salle des fêtes, Yaoundé"
                />
                <Field
                  label="L'adresse"
                  value={address}
                  onChange={setAddress}
                  placeholder="12 avenue des Palmiers"
                />
              </div>
            </div>
          </Section>

          <Section
            title="Le style"
            subtitle="Le même contenu. Deux façons de le montrer."
            icon={<Sparkles className="w-4 h-4" />}
            defaultOpen
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              {([
                ['elegance', 'Élégance', 'Clair et sobre. La photo du couple n’est pas obligatoire.'],
                ['motifs', 'Motifs des familles', 'Plus décoré, avec les deux tissus.'],
              ] as const).map(([value, label, text]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setInvitationTemplate(value)}
                  className={`text-left rounded-2xl border p-4 ${
                    invitationTemplate === value
                      ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{text}</p>
                </button>
              ))}
            </div>
            {invitationTemplate === 'motifs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <SingleImageUploader
                  label="Famille du marié"
                  help="Le tissu. Vous pouvez le changer ou l’enlever."
                  value={groomMotifImage}
                  onChange={setGroomMotifImage}
                />
                <SingleImageUploader
                  label="Famille de la mariée"
                  help="Le tissu. Vous pouvez le changer ou l’enlever."
                  value={brideMotifImage}
                  onChange={setBrideMotifImage}
                />
              </div>
            )}
          </Section>

          {/* ═══════ 2. LA CARTE & LES COULEURS ═══════ */}
          <Section
            title="2. Le mot et les couleurs"
            subtitle="Ce texte apparaît sur la carte. Écrivez comme vous parlez."
            icon={<Mail className="w-4 h-4" />}
          >
            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Les couleurs
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected =
                      primaryColor.toLowerCase() === preset.primary.toLowerCase() &&
                      rsvpButtonColor.toLowerCase() === preset.rsvp.toLowerCase();
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setPrimaryColor(preset.primary);
                          setAccentColor(preset.accent);
                          setRsvpButtonColor(preset.rsvp);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium border transition ${
                          isSelected
                            ? 'border-gray-900 dark:border-white bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/50"
                          style={{ backgroundColor: preset.rsvp }}
                        />
                        <span>{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field
                label="Le message sur la carte"
                help="Écrivez {couple} pour mettre les deux prénoms."
                value={inviteIntro}
                onChange={setInviteIntro}
                rows={3}
                placeholder="On a une grande nouvelle. {couple} se marient, et vous êtes invités."
              />
              <Field
                label="La phrase pour la date limite"
                value={rsvpDeadlineText}
                onChange={setRsvpDeadlineText}
                placeholder="Répondez avant le 15 mai"
              />
            </div>
          </Section>

          {/* ═══════ 3. PHOTOS & MUSIQUE ═══════ */}
          <Section
            title="3. Photos et musique"
            subtitle="Les photos se réduisent toutes seules."
            icon={<Camera className="w-4 h-4" />}
          >
            <div className="space-y-5 pt-4">
              <SingleImageUploader
                label="Photo du haut"
                help="Sans photo ici, on prend la première de la galerie."
                value={heroImage}
                onChange={setHeroImage}
              />

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Montrer les photos
                  </span>
                  <input
                    type="checkbox"
                    checked={secGallery}
                    onChange={(e) => setSecGallery(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
                {secGallery && (
                  <PhotoUploader
                    onPhotosChange={setCoverPhotos}
                    existingPhotos={coverPhotos}
                    maxPhotos={6}
                    label="Photos du couple"
                  />
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
                <label className="flex items-center justify-between gap-3 min-h-11">
                  <span>
                    <span className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Une musique à l&apos;ouverture
                    </span>
                    <span className="block text-[10px] text-gray-400">
                      Elle démarre quand on ouvre l&apos;invitation. Un bouton permet de la couper.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={musicEnabled}
                    onChange={(e) => setMusicEnabled(e.target.checked)}
                    className="w-5 h-5 accent-violet-600 rounded cursor-pointer"
                  />
                </label>
                <AudioUploader
                  value={musicUrl}
                  saved={musicHasFile && !musicUrl}
                  onChange={(url) => {
                    setMusicUrl(url);
                    if (url) {
                      setMusicEnabled(true);
                      setMusicHasFile(true);
                    }
                  }}
                  onClear={() => setMusicHasFile(false)}
                />
              </div>
            </div>
          </Section>

          {/* ═══════ 4. PROGRAMME, TENUE & INFOS ═══════ */}
          <Section
            title="4. La journée"
            subtitle="Le programme, la tenue, et ce qu’il faut savoir."
            icon={<Calendar className="w-4 h-4" />}
          >
            <div className="space-y-5 pt-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Montrer le compte à rebours
                </span>
                <input
                  type="checkbox"
                  checked={secCountdown}
                  onChange={(e) => setSecCountdown(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Le programme
                </label>
                <ProgramEditor items={program} onChange={setProgram} />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Les boissons
                </label>
                <p className="text-[10px] text-gray-400">Si vous n’en mettez pas, cette partie reste cachée.</p>
                {drinks.map((drink, index) => (
                  <div key={drink.id} className="flex gap-2">
                    <input
                      value={drink.name}
                      onChange={(e) => {
                        const next = [...drinks];
                        next[index] = { ...drink, name: e.target.value };
                        setDrinks(next);
                      }}
                      placeholder="Champagne"
                      className="flex-1 px-2.5 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <input
                      value={drink.desc}
                      onChange={(e) => {
                        const next = [...drinks];
                        next[index] = { ...drink, desc: e.target.value };
                        setDrinks(next);
                      }}
                      placeholder="Un mot court"
                      className="flex-1 px-2.5 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <button type="button" onClick={() => setDrinks(drinks.filter((_, i) => i !== index))} className="px-2 text-red-400">✕</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setDrinks([...drinks, { id: crypto.randomUUID(), name: '', desc: '', emoji: '' }])}
                  className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  + Ajouter une boisson
                </button>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Montrer la tenue
                  </span>
                  <input
                    type="checkbox"
                    checked={secDressCode}
                    onChange={(e) => setSecDressCode(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
                {secDressCode && (
                  <div className="space-y-3">
                    <Field
                      label="Quelle tenue ?"
                      value={dressCodeTitle}
                      onChange={setDressCodeTitle}
                      placeholder="Tenue de fête. Blanc et doré."
                    />
                    <PhotoUploader
                      onPhotosChange={setDressImages}
                      existingPhotos={dressImages}
                      maxPhotos={6}
                      label="Photos d'idées de tenue"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ce qu’il faut savoir
                </label>
                <PracticalInfoEditor items={practicalInfo} onChange={setPracticalInfo} />
              </div>
            </div>
          </Section>

          {/* ═══════ 5. NOTRE HISTOIRE & CONTACT (OPTIONNEL) ═══════ */}
          <Section
            title="5. Histoire, cadeau, contact"
            subtitle="Ces parties n’apparaissent que si vous les remplissez."
            icon={<Sparkles className="w-4 h-4" />}
          >
            <div className="space-y-4 pt-4">
              <Field
                label="Votre histoire"
                value={aboutStory1}
                onChange={setAboutStory1}
                rows={4}
                placeholder="On s’est rencontrés un soir d’été. Aujourd’hui, on veut vous avoir avec nous."
              />
              <SingleImageUploader
                label="Une photo pour cette histoire"
                value={aboutImage}
                onChange={setAboutImage}
              />

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-4">
                <Field
                  label="Lien de la cagnotte ou de la liste"
                  value={donationLink}
                  onChange={setDonationLink}
                  placeholder="https://..."
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="WhatsApp"
                    value={whatsappDonation}
                    onChange={setWhatsappDonation}
                    placeholder="+237 6 00 00 00 00"
                  />
                  <Field
                    label="E-mail"
                    value={supportEmail}
                    onChange={setSupportEmail}
                    type="email"
                    placeholder="vous@email.com"
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Boutons d'action en bas */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="py-3.5 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-2xl font-semibold text-sm disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer le brouillon'}
            </button>
            <button
              type="button"
              onClick={() => handleSave('preview')}
              disabled={saving}
              className="py-3.5 px-4 border border-violet-300 text-violet-700 dark:text-violet-300 rounded-2xl font-semibold text-sm disabled:opacity-50"
            >
              Aperçu
            </button>
            <button
              type="button"
              onClick={() => setConfirmPublish(true)}
              disabled={saving}
              className="py-3.5 px-4 bg-violet-600 text-white rounded-2xl font-bold text-sm disabled:opacity-50"
            >
              Publier
            </button>
          </div>
        </main>

        {/* Colonne de droite : Aperçu en direct du modèle */}
        <aside
          className={`lg:col-span-5 lg:sticky lg:top-20 ${
            showMobilePreview ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  Aperçu
                </span>
              </div>
              <a
                href={`/e/${event.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-violet-700 dark:text-violet-300 font-medium hover:underline"
              >
                Ouvrir ↗
              </a>
            </div>
            <div className="max-h-[78vh] overflow-y-auto">
              <InvitationExperience event={liveEvent} guestName="Invité(e)" rememberAnswer={false} />
            </div>
          </div>
        </aside>
      </div>
      {leaveAsk && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={() => setLeaveAsk(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Quitter cette page ?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Enregistrez d’abord, sinon les derniers changements seront perdus.</p>
            <div className="flex flex-col gap-2 mt-4">
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  if (!user && liveEvent) {
                    await writeCreationDraft({
                      slug: liveEvent.slug,
                      event: liveEvent,
                      savedAt: new Date().toISOString(),
                    });
                    setLeaveAsk(false);
                    router.push('/create');
                    return;
                  }
                  const saved = await handleSave('draft');
                  if (!saved) return;
                  setLeaveAsk(false);
                  router.push('/dashboard');
                }}
                className="py-3 bg-violet-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer et quitter'}
              </button>
              <button
                type="button"
                onClick={() => router.push(user ? '/dashboard' : '/create')}
                className="py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
              >
                Quitter sans enregistrer
              </button>
              <button type="button" onClick={() => setLeaveAsk(false)} className="py-3 text-sm text-gray-500">
                Rester
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmPublish && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={() => setConfirmPublish(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Publier maintenant ?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              {liveEvent.title}. {eventDate ? new Date(eventDate).toLocaleDateString('fr-FR') : ''} {location ? `· ${location}` : ''}.
              Modèle : {invitationTemplate === 'motifs' ? 'Motifs des familles' : 'Élégance contemporaine'}.
            </p>
            <p className="text-xs text-gray-500 mt-2">Le lien devient visible. Vous pourrez encore le modifier après.</p>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setConfirmPublish(false)} className="flex-1 py-3 border rounded-xl text-sm">Annuler</button>
              <button type="button" onClick={() => handleSave('publish')} disabled={saving} className="flex-1 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                {saving ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditEventPage() {
  return <EditEventContent />;
}
