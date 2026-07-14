'use client';

import { useState, useEffect } from 'react';
import { EventWithSettings, ProgramItem, PracticalInfoItem } from '@/types';
import { getEventBySlug } from '@/data/events';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const PROGRAM_COLORS = [
  { value: 'blue', label: 'Bleu' },
  { value: 'green', label: 'Vert' },
  { value: 'pink', label: 'Rose' },
  { value: 'purple', label: 'Violet' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'amber', label: 'Ambre' },
];

const PRACTICAL_ICONS = [
  { value: 'car', label: '🚗 Parking' },
  { value: 'bed', label: '🛏️ Hébergement' },
  { value: 'wine', label: '🍷 Boisson' },
  { value: 'shirt', label: '👔 Tenue' },
  { value: 'bus', label: '🚌 Transport' },
  { value: 'gift', label: '🎁 Cadeau' },
  { value: 'phone', label: '📞 Contact' },
  { value: 'info', label: 'ℹ️ Info' },
];

export default function EditInvitationPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <EditInvitationContent params={params} />
    </ProtectedRoute>
  );
}

function EditInvitationContent({ params }: { params: { id: string } }) {
  const eventId = params.id;
  const [event, setEvent] = useState<EventWithSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('textes');

  // Form state
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (eventId) {
      const loadedEvent = getEventBySlug(eventId);
      if (loadedEvent) {
        setEvent(loadedEvent);
        setFormData({
          title: loadedEvent.title || '',
          subtitle: loadedEvent.subtitle || '',
          welcomeMessage: loadedEvent.welcomeMessage || '',
          gateHint: loadedEvent.gateHint || '',
          inviteIntro: loadedEvent.inviteIntro || '',
          inviteSecondary: loadedEvent.inviteSecondary || '',
          mainText: loadedEvent.mainText || '',
          reserveText: loadedEvent.reserveText || '',
          rsvpDeadlineText: loadedEvent.rsvpDeadlineText || '',
          eventDate: loadedEvent.event_date?.split('T')[0] || '',
          eventTime: loadedEvent.event_date?.split('T')[1]?.substring(0, 5) || '',
          location: loadedEvent.location || '',
          address: loadedEvent.address || '',
          lat: loadedEvent.lat || '',
          lng: loadedEvent.lng || '',
          mapLink: loadedEvent.mapLink || '',
          mapImage: loadedEvent.mapImage || '',
          venueTitle: loadedEvent.venueTitle || '',
          primaryColor: loadedEvent.branding?.primaryColor || '#4caf50',
          accentColor: loadedEvent.branding?.accentColor || '#ec4899',
          rsvpButtonColor: loadedEvent.rsvpButtonColor || '#ec4899',
          programSectionTitle: loadedEvent.programSectionTitle || 'Programme de la journée',
          program: loadedEvent.program || [],
          practicalSectionTitle: loadedEvent.practicalSectionTitle || 'Informations pratiques',
          practicalInfo: loadedEvent.practicalInfo || [],
          welcomeImage: loadedEvent.welcomeImage || '',
          heroImage: loadedEvent.heroImage || '',
          bestPhotos: loadedEvent.bestPhotos || [],
          dressCodeTitle: loadedEvent.dressCodeTitle || 'Tenue élégante',
          dressImages: loadedEvent.dressImages || [],
          aboutTitle: loadedEvent.aboutTitle || 'Notre Histoire',
          aboutStory1: loadedEvent.aboutStory1 || '',
          aboutStory2: loadedEvent.aboutStory2 || '',
          aboutImage: loadedEvent.aboutImage || '',
          musicUrl: loadedEvent.ambiance?.musicUrl || '',
          musicVolume: loadedEvent.ambiance?.volume || 0.35,
          musicEnabled: loadedEvent.ambiance?.enabled !== false,
          whatsappDonationPhone: loadedEvent.whatsappDonationPhone || '',
          supportEmail: loadedEvent.supportEmail || '',
          donationLink: loadedEvent.links?.donation || '',
          metaDescription: loadedEvent.metaDescription || '',
        });
      }
      setLoading(false);
    }
  }, [eventId]);

  const handleSave = async () => {
    if (!event) return;
    setSaving(true);
    
    try {
      // Pour le MVP : sauvegarder en localStorage
      const updatedEvent: EventWithSettings = {
        ...event,
        ...formData,
        event_date: formData.eventDate ? `${formData.eventDate}T${formData.eventTime || '00:00'}:00` : event.event_date,
        branding: {
          ...event.branding,
          primaryColor: formData.primaryColor,
          accentColor: formData.accentColor,
          welcomeImage: formData.welcomeImage,
          heroImage: formData.heroImage,
        },
        ambiance: {
          ...event.ambiance,
          musicUrl: formData.musicUrl,
          volume: formData.musicVolume,
          enabled: formData.musicEnabled,
        },
        rsvpButtonColor: formData.rsvpButtonColor,
        program: formData.program,
        programSectionTitle: formData.programSectionTitle,
        practicalInfo: formData.practicalInfo,
        practicalSectionTitle: formData.practicalSectionTitle,
        dressImages: formData.dressImages,
        dressCodeTitle: formData.dressCodeTitle,
        aboutTitle: formData.aboutTitle,
        aboutStory1: formData.aboutStory1,
        aboutStory2: formData.aboutStory2,
        aboutImage: formData.aboutImage,
        links: {
          ...event.links,
          donation: formData.donationLink,
          whatsappDonation: formData.whatsappDonationPhone,
          supportEmail: formData.supportEmail,
        },
        metaDescription: formData.metaDescription,
        updated_at: new Date().toISOString(),
      } as any;

      localStorage.setItem(`event_${eventId}`, JSON.stringify(updatedEvent));
      setEvent(updatedEvent);
      alert('Modifications sauvegardées !');
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    window.open(`/e/${eventId}`, '_blank');
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/e/${eventId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Lien copié ! Partagez-le sur WhatsApp.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Événement introuvable</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Personnaliser l'invitation</h1>
            <p className="text-[10px] text-gray-500">Modifie tous les aspects de ton invitation</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePreview} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-200 transition">
              👁️ Aperçu
            </button>
            <button onClick={handleShare} className="px-4 py-2 bg-emerald-500 text-white text-xs font-semibold rounded-xl hover:bg-emerald-600 transition">
              📤 Partager
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
              {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-60px)] sticky top-[60px]">
          <nav className="p-4 space-y-1">
            {[
              { id: 'textes', label: '📝 Textes & Identité' },
              { id: 'date', label: '📅 Date & Lieu' },
              { id: 'couleurs', label: '🎨 Couleurs' },
              { id: 'programme', label: '🕐 Programme' },
              { id: 'pratique', label: 'ℹ️ Infos pratiques' },
              { id: 'photos', label: '🖼️ Photos' },
              { id: 'tenue', label: '👔 Code vestimentaire' },
              { id: 'musique', label: '♫ Musique' },
              { id: 'histoire', label: '📖 Notre histoire' },
              { id: 'liens', label: '🔗 Liens & Contact' },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition ${
                  activeSection === section.id
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            {/* Section: Textes */}
            {activeSection === 'textes' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Textes & Identité</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Titre de l'événement</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sous-titre</label>
                    <input type="text" value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message d'accueil</label>
                    <textarea value={formData.welcomeMessage} onChange={(e) => setFormData({...formData, welcomeMessage: e.target.value})} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Indication pour la porte</label>
                    <input type="text" value={formData.gateHint} onChange={(e) => setFormData({...formData, gateHint: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Texte d'invitation</label>
                    <textarea value={formData.inviteIntro} onChange={(e) => setFormData({...formData, inviteIntro: e.target.value})} rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Texte secondaire</label>
                    <textarea value={formData.inviteSecondary} onChange={(e) => setFormData({...formData, inviteSecondary: e.target.value})} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Section: Date & Lieu */}
            {activeSection === 'date' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Date & Lieu</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                      <input type="date" value={formData.eventDate} onChange={(e) => setFormData({...formData, eventDate: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                    </div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-2">Heure</label>
                      <input type="time" value={formData.eventTime} onChange={(e) => setFormData({...formData, eventTime: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                    </div>
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Nom du lieu</label>
                    <input type="text" value={formData.venueTitle} onChange={(e) => setFormData({...formData, venueTitle: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Adresse complète</label>
                    <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Section: Couleurs */}
            {activeSection === 'couleurs' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Couleurs</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Couleur principale</label>
                    <div className="flex gap-3">
                      <input type="color" value={formData.primaryColor} onChange={(e) => setFormData({...formData, primaryColor: e.target.value})} className="w-16 h-12 border border-gray-200 rounded-lg cursor-pointer" />
                      <input type="text" value={formData.primaryColor} onChange={(e) => setFormData({...formData, primaryColor: e.target.value})} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Couleur d'accent</label>
                    <div className="flex gap-3">
                      <input type="color" value={formData.accentColor} onChange={(e) => setFormData({...formData, accentColor: e.target.value})} className="w-16 h-12 border border-gray-200 rounded-lg cursor-pointer" />
                      <input type="text" value={formData.accentColor} onChange={(e) => setFormData({...formData, accentColor: e.target.value})} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                    </div>
                  </div>
                  <div className="mt-6 p-6 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-xs text-gray-500 mb-3">Aperçu des couleurs :</p>
                    <div className="flex gap-3">
                      <div className="w-20 h-20 rounded-xl shadow-md" style={{ backgroundColor: formData.primaryColor }} />
                      <div className="w-20 h-20 rounded-xl shadow-md" style={{ backgroundColor: formData.accentColor }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Programme */}
            {activeSection === 'programme' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Programme du jour</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  {formData.program?.map((step: ProgramItem, index: number) => (
                    <div key={index} className="flex gap-2 items-end p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1"><label className="block text-xs text-gray-600 mb-1">Heure</label>
                        <input type="text" value={step.time} onChange={(e) => {
                          const updated = formData.program.map((s: ProgramItem, i: number) => i === index ? { ...s, time: e.target.value } : s);
                          setFormData({...formData, program: updated});
                        }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      </div>
                      <div className="flex-1"><label className="block text-xs text-gray-600 mb-1">Intitulé</label>
                        <input type="text" value={step.title} onChange={(e) => {
                          const updated = formData.program.map((s: ProgramItem, i: number) => i === index ? { ...s, title: e.target.value } : s);
                          setFormData({...formData, program: updated});
                        }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      </div>
                      <select value={step.color} onChange={(e) => {
                        const updated = formData.program.map((s: ProgramItem, i: number) => i === index ? { ...s, color: e.target.value } : s);
                        setFormData({...formData, program: updated});
                      }} className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm">
                        {PROGRAM_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <button onClick={() => setFormData({...formData, program: formData.program.filter((_: any, i: number) => i !== index)})} className="px-3 py-2 text-red-600 hover:text-red-700 text-xs font-medium">✕</button>
                    </div>
                  ))}
                  <button onClick={() => {
                    const colors = ['blue', 'green', 'pink', 'purple', 'indigo', 'amber'];
                    setFormData({...formData, program: [...formData.program, { time: '', title: '', color: colors[formData.program.length % colors.length] }]});
                  }} className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:border-emerald-500 hover:text-emerald-600 transition">
                    + Ajouter une étape
                  </button>
                </div>
              </div>
            )}

            {/* Section: Infos pratiques */}
            {activeSection === 'pratique' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Infos pratiques</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  {formData.practicalInfo?.map((info: PracticalInfoItem, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-xl space-y-2">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1"><label className="block text-xs text-gray-600 mb-1">Icône</label>
                          <select value={info.icon} onChange={(e) => {
                            const updated = formData.practicalInfo.map((item: PracticalInfoItem, i: number) => i === index ? { ...item, icon: e.target.value } : item);
                            setFormData({...formData, practicalInfo: updated});
                          }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                            {PRACTICAL_ICONS.map(icon => <option key={icon.value} value={icon.value}>{icon.label}</option>)}
                          </select>
                        </div>
                        <div className="flex-1"><label className="block text-xs text-gray-600 mb-1">Titre</label>
                          <input type="text" value={info.title} onChange={(e) => {
                            const updated = formData.practicalInfo.map((item: PracticalInfoItem, i: number) => i === index ? { ...item, title: e.target.value } : item);
                            setFormData({...formData, practicalInfo: updated});
                          }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                        </div>
                        <button onClick={() => setFormData({...formData, practicalInfo: formData.practicalInfo.filter((_: any, i: number) => i !== index)})} className="px-3 py-2 text-red-600 hover:text-red-700 text-xs font-medium">✕</button>
                      </div>
                      <div><label className="block text-xs text-gray-600 mb-1">Description</label>
                        <textarea value={info.text} onChange={(e) => {
                          const updated = formData.practicalInfo.map((item: PracticalInfoItem, i: number) => i === index ? { ...item, text: e.target.value } : item);
                          setFormData({...formData, practicalInfo: updated});
                        }} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setFormData({...formData, practicalInfo: [...formData.practicalInfo, { icon: 'info', title: '', text: '' }]})} className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:border-emerald-500 hover:text-emerald-600 transition">
                    + Ajouter une info
                  </button>
                </div>
              </div>
            )}

            {/* Section: Photos */}
            {activeSection === 'photos' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Photos</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Image d'accueil (fond)</label>
                    <input type="text" value={formData.welcomeImage} onChange={(e) => setFormData({...formData, welcomeImage: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Image titre (bannière)</label>
                    <input type="text" value={formData.heroImage} onChange={(e) => setFormData({...formData, heroImage: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Galerie photos (URLs séparées par des virgules)</label>
                    <textarea value={formData.bestPhotos?.join(', ') || ''} onChange={(e) => setFormData({...formData, bestPhotos: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)})} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Section: Tenue */}
            {activeSection === 'tenue' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Code vestimentaire</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Titre de la section</label>
                    <input type="text" value={formData.dressCodeTitle} onChange={(e) => setFormData({...formData, dressCodeTitle: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Photos tenues (URLs séparées par des virgules, max 8)</label>
                    <textarea value={formData.dressImages?.join(', ') || ''} onChange={(e) => setFormData({...formData, dressImages: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean).slice(0, 8)})} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Section: Musique */}
            {activeSection === 'musique' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Musique</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.musicEnabled} onChange={(e) => setFormData({...formData, musicEnabled: e.target.checked})} className="w-4 h-4 rounded border-gray-300" />
                    <span className="text-sm font-medium text-gray-700">Activer la musique de fond</span>
                  </label>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">URL musique (MP3 ou YouTube)</label>
                    <input type="text" value={formData.musicUrl} onChange={(e) => setFormData({...formData, musicUrl: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Volume ({Math.round((formData.musicVolume || 0.35) * 100)}%)</label>
                    <input type="range" min="0" max="100" value={Math.round((formData.musicVolume || 0.35) * 100)} onChange={(e) => setFormData({...formData, musicVolume: Number(e.target.value) / 100})} className="w-full" />
                  </div>
                </div>
              </div>
            )}

            {/* Section: Histoire */}
            {activeSection === 'histoire' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Notre histoire</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Titre</label>
                    <input type="text" value={formData.aboutTitle} onChange={(e) => setFormData({...formData, aboutTitle: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Paragraphe 1</label>
                    <textarea value={formData.aboutStory1} onChange={(e) => setFormData({...formData, aboutStory1: e.target.value})} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Paragraphe 2</label>
                    <textarea value={formData.aboutStory2} onChange={(e) => setFormData({...formData, aboutStory2: e.target.value})} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Image</label>
                    <input type="text" value={formData.aboutImage} onChange={(e) => setFormData({...formData, aboutImage: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Section: Liens */}
            {activeSection === 'liens' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Liens & Contact</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp pour dons</label>
                    <input type="text" value={formData.whatsappDonationPhone} onChange={(e) => setFormData({...formData, whatsappDonationPhone: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Email support</label>
                    <input type="email" value={formData.supportEmail} onChange={(e) => setFormData({...formData, supportEmail: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Lien donation alternatif</label>
                    <input type="text" value={formData.donationLink} onChange={(e) => setFormData({...formData, donationLink: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Description SEO</label>
                    <textarea value={formData.metaDescription} onChange={(e) => setFormData({...formData, metaDescription: e.target.value})} rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}