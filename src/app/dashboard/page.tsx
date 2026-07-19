'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import GuestManager from '@/components/admin/GuestManager';
import { EventWithSettings } from '@/types';
import { isSupabaseReady } from '@/config/supabase';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();

  const [events, setEvents] = useState<EventWithSettings[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventWithSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newEventName, setNewEventName] = useState('');

  // Charger les événements (mode démo : localStorage)
  const loadEvents = useCallback(() => {
    // Mode démo : charger depuis localStorage
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('invitia_demo_events') || '[]');
      setEvents(stored);
    }
    setLoading(false);
  }, []);

  // Chargement initial
  useEffect(() => {
    if (authLoading) return;
    loadEvents();
  }, [authLoading, loadEvents]);

  // Créer un événement
  const handleCreateEvent = () => {
    if (!newEventName.trim()) return;

    const slug = newEventName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now().toString(36).slice(-4);

    const newEvent: EventWithSettings = {
      id: 'event_' + Date.now(),
      slug,
      title: newEventName.trim(),
      user_id: user?.id || 'demo_user',
      type: 'wedding',
      event_date: new Date().toISOString(),
      location: '',
      is_published: false,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newEvent, ...events];
    setEvents(updated);
    localStorage.setItem('invitia_demo_events', JSON.stringify(updated));
    setNewEventName('');
    setShowCreateInput(false);
  };

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes événements</h1>
              <p className="text-gray-600 mt-1">Gérez vos invitations</p>
            </div>
            <button
              onClick={() => setShowCreateInput(true)}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
            >
              + Créer un événement
            </button>
          </div>

          {/* Formulaire création rapide */}
          {showCreateInput && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="Nom de l'événement (ex: Mariage de Paul et Marie)"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateEvent()}
                />
                <button
                  onClick={handleCreateEvent}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition"
                >
                  Créer
                </button>
                <button
                  onClick={() => setShowCreateInput(false)}
                  className="px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste des événements */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-gray-500 mb-4">
                Vous n'avez pas encore d'événement. Créez votre première invitation !
              </p>
              <button
                onClick={() => setShowCreateInput(true)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
              >
                Créer votre premier événement
              </button>
            </div>
          ) : (
            <>
              {/* Cartes des événements */}
              <div className="grid gap-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`bg-white rounded-xl p-6 shadow-sm border transition cursor-pointer ${
                      selectedEvent?.id === event.id
                        ? 'border-emerald-500 ring-2 ring-emerald-200'
                        : 'border-gray-200 hover:shadow-md hover:border-emerald-300'
                    }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {event.event_date
                            ? new Date(event.event_date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : 'Date non définie'}
                        </p>
                        {event.location && (
                          <p className="text-sm text-gray-500 mt-1">{event.location}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <a
                            href={`/e/${event.slug}`}
                            target="_blank"
                            className="text-xs text-emerald-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🔗 Voir l'invitation
                          </a>
                          <a
                            href={`/create/${event.slug}/edit`}
                            className="text-xs text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            ✏️ Personnaliser
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          event.is_published
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {event.is_published ? 'Publié' : 'Brouillon'}
                        </span>
                      </div>
                    </div>

                    {/* Détails de l'événement sélectionné */}
                    {selectedEvent?.id === event.id && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <GuestManager event={event} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}