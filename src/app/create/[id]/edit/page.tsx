'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { EventWithSettings } from '@/types';
import { loadEvent, saveEvent } from '@/lib/utils/eventManager';

export default function EditInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [event, setEvent] = useState<EventWithSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('textes');

  // Form state
  const [formData, setFormData] = useState({
    // Textes
    title: '',
    subtitle: '',
    welcomeMessage: '',
    gateHint: '',
    inviteIntro: '',
    inviteSecondary: '',
    mainText: '',
    reserveText: '',
    rsvpDeadlineText: '',
    
    // Date
    eventDate: '',
    eventTime: '',
    
    // Lieu
    location: '',
    address: '',
    lat: '',
    lng: '',
    
    // Couleurs
    primaryColor: '#4caf50',
    accentColor: '#ec4899',
    
    // Code vestimentaire
    dressCodeTitle: '',
    
    // Musique
    musicUrl: '',
    musicVolume: 0.35,
  });

  useEffect(() => {
    async function loadEventData() {
      try {
        const loadedEvent = await loadEvent(id);
        if (loadedEvent) {
          setEvent(loadedEvent);
          // Pré-remplir le formulaire
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
            primaryColor: loadedEvent.branding?.primaryColor || '#4caf50',
            accentColor: loadedEvent.branding?.accentColor || '#ec4899',
            dressCodeTitle: loadedEvent.dressCodeTitle || '',
            musicUrl: loadedEvent.ambiance?.musicUrl || '',
            musicVolume: loadedEvent.ambiance?.volume || 0.35,
          });
        }
      } catch (error) {
        console.error('Error loading event:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEventData();
  }, [id]);

  const handleSave = async () => {
    if (!event) return;
    
    setSaving(true);
    
    try {
      // Mettre à jour l'événement avec les nouvelles données
      const updatedEvent: EventWithSettings = {
        ...event,
        ...formData,
        event_date: formData.eventDate ? `${formData.eventDate}T${formData.eventTime || '00:00'}:00` : event.event_date,
        branding: {
          ...event.branding,
          primaryColor: formData.primaryColor,
          accentColor: formData.accentColor,
        },
        ambiance: {
          ...event.ambiance,
          musicUrl: formData.musicUrl,
          volume: formData.musicVolume,
        },
        updated_at: new Date().toISOString(),
      };

      // Sauvegarder
      const saved = await saveEvent(updatedEvent);
      
      if (saved) {
        setEvent(updatedEvent);
        alert('Modifications sauvegardées !');
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    window.open(`/e/${id}`, '_blank');
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/e/${id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Lien copié ! Partage-le sur WhatsApp.');
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
            <button
              onClick={handlePreview}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-200 transition"
            >
              👁️ Aperçu
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-emerald-500 text-white text-xs font-semibold rounded-xl hover:bg-emerald-600 transition"
            >
              📤 Partager
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            >
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
              { id: 'textes', label: '📝 Textes & Identité', icon: '📝' },
              { id: 'date', label: '📅 Date & Lieu', icon: '📅' },
              { id: 'couleurs', label: '🎨 Couleurs', icon: '🎨' },
              { id: 'programme', label: '🕐 Programme', icon: '🕐' },
              { id: 'pratique', label: 'ℹ️ Infos pratiques', icon: 'ℹ️' },
              { id: 'photos', label: '🖼️ Photos', icon: '🖼️' },
              { id: 'tenue', label: '👔 Code vestimentaire', icon: '👔' },
              { id: 'musique', label: '♫ Musique', icon: '♫' },
              { id: 'sections', label: '⚙️ Sections', icon: '⚙️' },
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
                {section.icon} {section.label}
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
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Ex: Mariage de Jean et Marie"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sous-titre</label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Ex: Jean et Marie"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message d'accueil</label>
                    <textarea
                      value={formData.welcomeMessage}
                      onChange={(e) => setFormData({...formData, welcomeMessage: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Message sur la porte d'accueil"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Indication pour la porte</label>
                    <input
                      type="text"
                      value={formData.gateHint}
                      onChange={(e) => setFormData({...formData, gateHint: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Ex: Veuillez saisir votre nom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Texte d'invitation</label>
                    <textarea
                      value={formData.inviteIntro}
                      onChange={(e) => setFormData({...formData, inviteIntro: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Texte principal de l'invitation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Texte secondaire</label>
                    <textarea
                      value={formData.inviteSecondary}
                      onChange={(e) => setFormData({...formData, inviteSecondary: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Texte complémentaire"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Texte principal</label>
                    <textarea
                      value={formData.mainText}
                      onChange={(e) => setFormData({...formData, mainText: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Texte détaillé avec lieu et date"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bouton RSVP</label>
                    <input
                      type="text"
                      value={formData.reserveText}
                      onChange={(e) => setFormData({...formData, reserveText: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Ex: Confirmer ma présence"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date limite RSVP</label>
                    <input
                      type="text"
                      value={formData.rsvpDeadlineText}
                      onChange={(e) => setFormData({...formData, rsvpDeadlineText: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Ex: Merci de confirmer avant le 25 avril 2026"
                    />
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
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Heure</label>
                      <input
                        type="time"
                        value={formData.eventTime}
                        onChange={(e) => setFormData({...formData, eventTime: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du lieu</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Ex: Sultani River"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse complète</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Ex: 32, avenue de la Justice (Gombe), Kinshasa, RDC"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
                      <input
                        type="text"
                        value={formData.lat}
                        onChange={(e) => setFormData({...formData, lat: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="-4.3215"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
                      <input
                        type="text"
                        value={formData.lng}
                        onChange={(e) => setFormData({...formData, lng: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="15.3128"
                      />
                    </div>
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
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                        className="w-16 h-12 border border-gray-200 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="#4caf50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Couleur d'accent</label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={formData.accentColor}
                        onChange={(e) => setFormData({...formData, accentColor: e.target.value})}
                        className="w-16 h-12 border border-gray-200 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.accentColor}
                        onChange={(e) => setFormData({...formData, accentColor: e.target.value})}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="#ec4899"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-6 p-6 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-xs text-gray-500 mb-3">Aperçu des couleurs :</p>
                    <div className="flex gap-3">
                      <div
                        className="w-20 h-20 rounded-xl shadow-md"
                        style={{ backgroundColor: formData.primaryColor }}
                      />
                      <div
                        className="w-20 h-20 rounded-xl shadow-md"
                        style={{ backgroundColor: formData.accentColor }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder pour les autres sections */}
            {!['textes', 'date', 'couleurs'].includes(activeSection) && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
                </h2>
                
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  <div className="text-6xl mb-4">🚧</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Section en construction</h3>
                  <p className="text-sm text-gray-600">
                    Cette section sera implémentée dans la prochaine phase.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}