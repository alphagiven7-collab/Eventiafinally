'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { EventWithSettings } from '@/types';
import { isSupabaseReady } from '@/config/supabase';
import { getUserEvents, saveEvent, deleteEvent, deletePhotos, migrateFromLocalStorage } from '@/lib/storage';
import { Trash2, Eye, Edit3, Plus, Calendar, MapPin, ExternalLink, Users, Crown } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();

  const [events, setEvents] = useState<EventWithSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<EventWithSettings | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Charger les événements
  const loadEvents = useCallback(async () => {
    if (!user?.id) return;

    // Mode Supabase réel
    if (isSupabaseReady()) {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setEvents(data as EventWithSettings[]);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Erreur chargement Supabase:', err);
      }
    }

    // Fallback IndexedDB (filtré par userId)
    try {
      await migrateFromLocalStorage(user.id);
      const userEvents = await getUserEvents(user.id);
      setEvents(userEvents);
    } catch (err) {
      console.error('Erreur chargement IndexedDB:', err);
      setEvents([]);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    loadEvents();
  }, [authLoading, loadEvents]);

  // Créer un événement
  const handleCreateEvent = async () => {
    if (!newEventName.trim() || !user?.id) return;

    const slug = newEventName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now().toString(36).slice(-4);

    // Mode Supabase réel
    if (isSupabaseReady() && user?.id) {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { error } = await supabase.from('events').insert({
          slug,
          title: newEventName.trim(),
          user_id: user.id,
          event_type: 'wedding',
          is_published: false,
        });

        if (!error) {
          setNewEventName('');
          setShowCreateInput(false);
          loadEvents();
          return;
        }
      } catch (err) {
        console.error('Erreur création Supabase:', err);
      }
    }

    // Fallback IndexedDB
    const newEvent: EventWithSettings = {
      id: 'event_' + Date.now(),
      slug,
      title: newEventName.trim(),
      user_id: user.id,
      type: 'wedding',
      event_date: new Date().toISOString(),
      location: '',
      is_published: false,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveEvent(user.id, newEvent);
    setNewEventName('');
    setShowCreateInput(false);
    loadEvents();
  };

  // Supprimer un événement
  const handleDeleteEvent = async () => {
    if (!deleteTarget || !user?.id) return;
    setDeleting(true);

    try {
      // Supabase
      if (isSupabaseReady()) {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          await supabase.from('events').delete().eq('id', deleteTarget.id);
        } catch {}
      }

      // IndexedDB
      await deleteEvent(user.id, deleteTarget.id);
      await deletePhotos(deleteTarget.id);

      setDeleteTarget(null);
      loadEvents();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
    setDeleting(false);
  };

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Bannière Premium */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Passez à Premium</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">200 invités, QR jour J, analytics, exports • 30$ une fois</p>
              </div>
            </div>
            <a href="/pricing" className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition shadow-sm">
              Découvrir
            </a>
          </div>

          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mes événements</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {events.length > 0 ? `${events.length} invitation${events.length > 1 ? 's' : ''}` : 'Aucune invitation pour le moment'}
              </p>
            </div>
            <button
              onClick={() => setShowCreateInput(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-blue-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 hover:shadow-xl transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Créer
            </button>
          </div>

          {/* Formulaire création rapide */}
          {showCreateInput && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="Nom de l'événement (ex: Mariage de Paul et Marie)"
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400 outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateEvent()}
                />
                <button
                  onClick={handleCreateEvent}
                  className="px-5 py-3 bg-gradient-to-r from-rose-500 to-blue-500 text-white rounded-xl font-medium text-sm hover:shadow-lg transition active:scale-95"
                >
                  Créer
                </button>
                <button
                  onClick={() => setShowCreateInput(false)}
                  className="px-4 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste des événements */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="text-4xl mb-4">💌</div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Vous n'avez pas encore d'événement. Créez votre première invitation.
              </p>
              <button
                onClick={() => setShowCreateInput(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-blue-500 text-white rounded-xl font-medium text-sm hover:shadow-lg transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Créer mon invitation
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">💍</span>
                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">{event.title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {event.event_date && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        )}
                        {event.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Statut */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                      event.is_published
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {event.is_published ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <a
                      href={`/e/${event.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Aperçu
                    </a>
                    <a
                      href={`/create/${event.slug}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Modifier
                    </a>
                    <a
                      href={`/dashboard/invites`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Invités
                    </a>
                    <button
                      onClick={() => setDeleteTarget(event)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>

      {/* Modal de confirmation suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-2">Supprimer cet événement ?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              &ldquo;{deleteTarget.title}&rdquo; sera définitivement supprimé. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}