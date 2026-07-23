'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/components/ui';
import PhotoUploader from '@/components/ui/photo-uploader';
import { Music, Upload, X } from 'lucide-react';
import { getEventIdentity } from '@/constants/design-language';
import { EventType, ProgramItem, PracticalInfoItem } from '@/types';
import { saveEvent } from '@/lib/storage';

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
   Champ texte réutilisable
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
   Uploader audio local
   ───────────────────────────────────────────── */
function AudioUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
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
        id="audio-upload-input-create"
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
          htmlFor="audio-upload-input-create"
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
            <p className="text-[10px] text-gray-400 dark:text-gray-500">MP3, OGG, WAV</p>
          </div>
        </label>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Uploader image unique
   ───────────────────────────────────────────── */
function SingleImageUploader({
  label,
  value,
  onChange,
}: {
  label: string;
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

/* ═══════════════════════════════════════════════
   PAGE PRINCIPALE - CRÉATION D'ÉVÉNEMENT
   ═══════════════════════════════════════════════ */
function CreateEventContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

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
  const [coupleLeft, setCoupleLeft] = useState('');
  const [coupleRight, setCoupleRight] = useState('');
  const [coverPhotos, setCoverPhotos] = useState<string[]>([]);
  const [heroImage, setHeroImage] = useState('');
  const [welcomeImage, setWelcomeImage] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [gateHint, setGateHint] = useState('');
  const [inviteIntro, setInviteIntro] = useState('');
  const [inviteSecondary, setInviteSecondary] = useState('');
  const [mainText, setMainText] = useState('');
  const [reserveText, setReserveText] = useState('');
  const [rsvpDeadlineText, setRsvpDeadlineText] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4caf50');
  const [accentColor, setAccentColor] = useState('#ec4899');
  const [rsvpButtonColor, setRsvpButtonColor] = useState('#ec4899');
  const [aboutTitle, setAboutTitle] = useState('');
  const [aboutStory1, setAboutStory1] = useState('');
  const [aboutStory2, setAboutStory2] = useState('');
  const [aboutImage, setAboutImage] = useState('');
  const [programSectionTitle, setProgramSectionTitle] = useState('');
  const [program, setProgram] = useState<ProgramItem[]>([]);
  const [venue, setVenue] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueMapImage, setVenueMapImage] = useState('');
  const [venueMapLink, setVenueMapLink] = useState('');
  const [dressCodeTitle, setDressCodeTitle] = useState('');
  const [dressImages, setDressImages] = useState<string[]>([]);
  const [practicalSectionTitle, setPracticalSectionTitle] = useState('');
  const [practicalInfo, setPracticalInfo] = useState<PracticalInfoItem[]>([]);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicUrl, setMusicUrl] = useState('');
  const [musicVolume, setMusicVolume] = useState(35);
  const [supportEmail, setSupportEmail] = useState('');
  const [donationLink, setDonationLink] = useState('');
  const [whatsappDonation, setWhatsappDonation] = useState('');
  const [whatsappDonationMessage, setWhatsappDonationMessage] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.eventDate || !formData.location) {
      addToast('error', 'Veuillez remplir les champs obligatoires.');
      return;
    }

    setLoading(true);

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
      hero_image: heroImage || '',
      heroImage: heroImage || undefined,
      welcomeImage: welcomeImage || undefined,
      bestPhotos: coverPhotos.filter(Boolean),
      coupleLeft: coupleLeft || undefined,
      coupleRight: coupleRight || undefined,
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
      venueDetails: venue || venueAddress ? {
        title: venue || formData.location,
        address: venueAddress || formData.address || '',
        lat: '',
        lng: '',
        mapImage: venueMapImage || '',
      } : undefined,
      dressCodeTitle: dressCodeTitle || undefined,
      dressImages: dressImages.length > 0 ? dressImages : undefined,
      practicalSectionTitle: practicalSectionTitle || undefined,
      practicalInfo: practicalInfo.length > 0 ? practicalInfo : undefined,
      ambiance: musicEnabled
        ? { enabled: true, musicUrl, volume: musicVolume / 100 }
        : { enabled: false, musicUrl: '', volume: 0.35 },
      links: {
        map: venueMapLink || undefined,
        supportEmail: supportEmail || undefined,
        donation: donationLink || undefined,
        whatsappDonation: whatsappDonation || undefined,
        donationWhatsAppMessage: whatsappDonationMessage || undefined,
      },
      supportEmail: supportEmail || undefined,
      mapLink: venueMapLink || undefined,
      sections: {
        gallery: true,
        countdown: true,
        dressCode: true,
        quiz: false,
        donation: false,
        guestbook: false,
      },
      adminCode: adminCode || undefined,
      user_id: user?.id || 'demo_user',
      is_published: false,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (user?.id) {
      await saveEvent(user.id, newEvent as any);
    }

    addToast('success', 'Événement créé ! Redirection vers l\'aperçu...');
    router.push(`/e/${slug}`);
    setLoading(false);
  };

  const addProgramItem = () => setProgram([...program, { time: '', title: '', color: 'pink' }]);
  const removeProgramItem = (i: number) => setProgram(program.filter((_, idx) => idx !== i));
  const updateProgramItem = (i: number, field: keyof ProgramItem, val: string) => {
    const copy = [...program];
    copy[i] = { ...copy[i], [field]: val };
    setProgram(copy);
  };

  const addPracticalInfo = () => setPracticalInfo([...practicalInfo, { icon: 'car', title: '', text: '' }]);
  const removePracticalInfo = (i: number) => setPracticalInfo(practicalInfo.filter((_, idx) => idx !== i));
  const updatePracticalInfo = (i: number, field: keyof PracticalInfoItem, val: string) => {
    const copy = [...practicalInfo];
    copy[i] = { ...copy[i], [field]: val };
    setPracticalInfo(copy);
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

      <main className="max-w-lg mx-auto px-5 py-6 space-y-4">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mb-1">Créez votre invitation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Remplissez les informations ci-dessous</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. DÉTAILS */}
          <Section title="Les détails de votre événement" subtitle="Commençons par l'essentiel : qui, quand et où !" icon="📝" defaultOpen>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nom de votre événement" help="Ex: Le mariage de Marie & Pierre" value={formData.title} onChange={(v) => setFormData({ ...formData, title: v })} required placeholder="Ex: Le mariage de Marie & Pierre" />
                <Field label="Petit mot d'accroche" value={formData.subtitle} onChange={(v) => setFormData({ ...formData, subtitle: v })} placeholder="Ex: Célébrons notre amour" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Prénom de la première personne" help="Sera affiché à gauche" value={coupleLeft} onChange={setCoupleLeft} placeholder="Ex: Marie" />
                <Field label="Prénom de la deuxième personne" help="Sera affiché à droite" value={coupleRight} onChange={setCoupleRight} placeholder="Ex: Pierre" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Date de l'événement" help="Le grand jour !" value={formData.eventDate} onChange={(v) => setFormData({ ...formData, eventDate: v })} type="date" required />
                <Field label="Heure de début" value={formData.eventTime} onChange={(v) => setFormData({ ...formData, eventTime: v })} type="time" />
                <Field label="Ville ou lieu" help="Ex: Paris" value={formData.location} onChange={(v) => setFormData({ ...formData, location: v })} required placeholder="Ex: Paris" />
              </div>
              <Field label="Adresse complète" value={formData.address} onChange={(v) => setFormData({ ...formData, address: v })} placeholder="Ex: 123 rue de Paris, 75001" />
              <Field label="Description" help="Quelques mots sur votre événement (optionnel)" value={formData.description} onChange={(v) => setFormData({ ...formData, description: v })} rows={3} placeholder="Ex: Nous sommes heureux de vous convier..." />
            </div>
          </Section>

          {/* 2. PHOTOS */}
          <Section title="Vos photos" subtitle="Ajoutez les photos qui rendront votre invitation unique" icon="📸">
            <div className="space-y-4 pt-4">
              <SingleImageUploader label="Photo de couverture (celle en haut)" value={heroImage} onChange={setHeroImage} />
              <SingleImageUploader label="Photo d'accueil (avant d'ouvrir l'invitation)" value={welcomeImage} onChange={setWelcomeImage} />
              <PhotoUploader onPhotosChange={setCoverPhotos} existingPhotos={coverPhotos} maxPhotos={5} label="Votre galerie de photos (max 5)" />
            </div>
          </Section>

          {/* 3. MESSAGE D'ACCUEIL */}
          <Section title="Message d'accueil" subtitle="Ce que vos invités verront avant de découvrir l'invitation" icon="🚪">
            <div className="space-y-4 pt-4">
              <Field label="Votre message de bienvenue" help="Écrivez quelques mots chaleureux" value={welcomeMessage} onChange={setWelcomeMessage} rows={3} placeholder="Ex: Nous sommes ravis de vous inviter..." />
              <Field label="Invitation à entrer son nom" value={gateHint} onChange={setGateHint} placeholder="Ex: Entrez votre prénom pour ouvrir votre invitation" />
            </div>
          </Section>

          {/* 4. CONTENU INVITATION */}
          <Section title="Contenu de l'invitation" subtitle="Le texte sur la carte d'invitation" icon="💌">
            <div className="space-y-4 pt-4">
              <Field label="Texte d'introduction" help="Tapez {'{couple}'} pour insérer automatiquement les prénoms" value={inviteIntro} onChange={setInviteIntro} rows={3} placeholder="Ex: Nous avons la joie de vous inviter au mariage de {couple}..." />
              <Field label="Texte complémentaire" value={inviteSecondary} onChange={setInviteSecondary} rows={3} placeholder="Ex: Nous serions honorés de votre présence..." />
              <Field label="Message personnel" value={mainText} onChange={setMainText} rows={3} placeholder="Ex: Venez célébrer ce moment unique avec nous..." />
              <Field label="Texte du bouton de confirmation" value={reserveText} onChange={setReserveText} placeholder="Ex: Confirmer ma présence" />
              <Field label="Date limite pour confirmer" value={rsvpDeadlineText} onChange={setRsvpDeadlineText} placeholder="Ex: Merci de confirmer avant le 15 mars 2026" />
            </div>
          </Section>

          {/* 5. COULEURS */}
          <Section title="Les couleurs" subtitle="Choisissez les couleurs qui reflètent votre style" icon="🎨">
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Couleur dominante</label>
                  <div className="flex gap-2">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                    <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Couleur secondaire</label>
                  <div className="flex gap-2">
                    <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                    <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Couleur du bouton de confirmation</label>
                <div className="flex gap-2">
                  <input type="color" value={rsvpButtonColor} onChange={(e) => setRsvpButtonColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                  <input type="text" value={rsvpButtonColor} onChange={(e) => setRsvpButtonColor(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                </div>
              </div>
            </div>
          </Section>

          {/* 6. NOTRE HISTOIRE */}
          <Section title="Notre histoire" subtitle="Racontez votre parcours (optionnel)" icon="💑">
            <div className="space-y-4 pt-4">
              <Field label="Titre de cette section" value={aboutTitle} onChange={setAboutTitle} placeholder="Ex: Notre histoire" />
              <Field label="Comment vous vous êtes rencontrés" value={aboutStory1} onChange={setAboutStory1} rows={3} placeholder="Ex: Tout a commencé un soir d'été..." />
              <Field label="La suite de votre histoire" value={aboutStory2} onChange={setAboutStory2} rows={3} placeholder="Ex: Et puis un jour, la demande en mariage..." />
              <SingleImageUploader label="Photo pour illustrer votre histoire" value={aboutImage} onChange={setAboutImage} />
            </div>
          </Section>

          {/* 7. PROGRAMME */}
          <Section title="Déroulé de la journée" subtitle="Indiquez le programme à vos invités" icon="📅">
            <div className="space-y-4 pt-4">
              <Field label="Titre de cette section" value={programSectionTitle} onChange={setProgramSectionTitle} placeholder="Ex: Déroulé de la journée" />
              {program.map((item, i) => (
                <div key={i} className="flex gap-2 items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input type="text" value={item.time} onChange={(e) => updateProgramItem(i, 'time', e.target.value)} placeholder="19h30" className="px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                    <input type="text" value={item.title} onChange={(e) => updateProgramItem(i, 'title', e.target.value)} placeholder="Cérémonie" className="col-span-2 px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                  </div>
                  <select value={item.color} onChange={(e) => updateProgramItem(i, 'color', e.target.value)} className="px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <option value="pink">🌹</option>
                    <option value="blue">💙</option>
                    <option value="green">💚</option>
                    <option value="purple">💜</option>
                  </select>
                  <button type="button" onClick={() => removeProgramItem(i)} className="p-2 text-red-400 hover:text-red-600 rounded-lg">✕</button>
                </div>
              ))}
              <button type="button" onClick={addProgramItem} className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-rose-300 hover:text-rose-500 transition">
                + Ajouter une étape
              </button>
            </div>
          </Section>

          {/* 8. LIEU */}
          <Section title="Où ça se passe ?" subtitle="Aidez vos invités à trouver le lieu" icon="📍">
            <div className="space-y-4 pt-4">
              <Field label="Nom du lieu" value={venue} onChange={setVenue} placeholder="Ex: Château de Versailles" />
              <Field label="Adresse complète" value={venueAddress} onChange={setVenueAddress} placeholder="Ex: Place d'Armes, 78000 Versailles" />
              <Field label="Lien Google Maps" value={venueMapLink} onChange={setVenueMapLink} placeholder="Ex: https://maps.google.com/..." />
              <SingleImageUploader label="Photo ou image du lieu" value={venueMapImage} onChange={setVenueMapImage} />
            </div>
          </Section>

          {/* 9. DRESS CODE */}
          <Section title="Tenue vestimentaire" subtitle="Indiquez la tenue à vos invités (optionnel)" icon="👔">
            <div className="space-y-4 pt-4">
              <Field label="Quelle tenue ?" value={dressCodeTitle} onChange={setDressCodeTitle} placeholder="Ex: Tenue élégante" />
              <PhotoUploader onPhotosChange={setDressImages} existingPhotos={dressImages} maxPhotos={8} label="Photos d'inspiration" />
            </div>
          </Section>

          {/* 10. INFOS PRATIQUES */}
          <Section title="Infos utiles" subtitle="Parking, hébergement... (optionnel)" icon="ℹ️">
            <div className="space-y-4 pt-4">
              <Field label="Titre de cette section" value={practicalSectionTitle} onChange={setPracticalSectionTitle} placeholder="Ex: Informations pratiques" />
              {practicalInfo.map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 space-y-2">
                  <div className="flex gap-2 items-center">
                    <select value={item.icon} onChange={(e) => updatePracticalInfo(i, 'icon', e.target.value)} className="px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                      <option value="car">🚗</option>
                      <option value="bed">🏨</option>
                      <option value="wine">🍷</option>
                    </select>
                    <input type="text" value={item.title} onChange={(e) => updatePracticalInfo(i, 'title', e.target.value)} placeholder="Titre" className="flex-1 px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                    <button type="button" onClick={() => removePracticalInfo(i)} className="p-2 text-red-400 hover:text-red-600 rounded-lg">✕</button>
                  </div>
                  <textarea value={item.text} onChange={(e) => updatePracticalInfo(i, 'text', e.target.value)} placeholder="Description..." rows={2} className="w-full px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none" />
                </div>
              ))}
              <button type="button" onClick={addPracticalInfo} className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-rose-300 hover:text-rose-500 transition">
                + Ajouter une info
              </button>
            </div>
          </Section>

          {/* 11. MUSIQUE */}
          <Section title="Musique d'ambiance" subtitle="Ajoutez une musique (optionnel)" icon="🎵">
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={musicEnabled} onChange={(e) => setMusicEnabled(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-rose-300 dark:peer-focus:ring-rose-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-rose-500" />
                </label>
                <span className="text-xs text-gray-700 dark:text-gray-300">Oui, je veux une musique de fond</span>
              </div>
              {musicEnabled && (
                <>
                  <AudioUploader value={musicUrl} onChange={setMusicUrl} />
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Volume ({musicVolume}%)</label>
                    <input type="range" min={0} max={100} value={musicVolume} onChange={(e) => setMusicVolume(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                  </div>
                </>
              )}
            </div>
          </Section>

          {/* 12. CONTACT */}
          <Section title="Contact et liens utiles" subtitle="Comment vous joindre (optionnel)" icon="📩">
            <div className="space-y-4 pt-4">
              <Field label="Votre email de contact" value={supportEmail} onChange={setSupportEmail} type="email" placeholder="Ex: marie.pierre@email.com" />
              <Field label="Lien pour offrir un cadeau" value={donationLink} onChange={setDonationLink} placeholder="Ex: https://www.cagnotte.com/..." />
              <Field label="Numéro WhatsApp" value={whatsappDonation} onChange={setWhatsappDonation} placeholder="Ex: +33612345678" />
              <Field label="Message WhatsApp pré-rempli" value={whatsappDonationMessage} onChange={setWhatsappDonationMessage} rows={2} placeholder="Ex: Bonjour ! Je souhaite contribuer..." />
            </div>
          </Section>

          {/* 13. SÉCURITÉ */}
          <Section title="Sécurité" subtitle="Protégez votre événement (optionnel)" icon="🔒">
            <div className="space-y-4 pt-4">
              <Field label="Mot de passe de l'événement" help="Un code secret pour modifier cet événement" value={adminCode} onChange={setAdminCode} placeholder="Ex: mon-code-secret-2026" />
            </div>
          </Section>

          {/* BOUTON */}
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