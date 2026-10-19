'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { EventWithSettings } from '@/types';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { deleteInvitation, listInvitations, ownedEventCount, publishInvitation } from '@/lib/events/store';
import { SUPABASE_REQUIRED } from '@/providers/auth-provider';
import { Trash2, Eye, Edit3, Plus, Calendar, MapPin, Users, Share2, Heart } from 'lucide-react';
import { StoryArt } from '@/components/brand/StoryArt';
import { formatUsd, FREE_EVENT_LIMIT, GUEST_PACKS, packTotalUsd, TRIAL_INVITATIONS } from '@/constants/pricing';
import EventPermission from '@/components/account/EventPermission';
import InstallApp from '@/components/pwa/InstallApp';
import { useOrganizerUnlocked } from '@/hooks/useOrganizerUnlocked';

function eventStatus(event: EventWithSettings) {
  if (event.isBlocked) {
    return { label: 'Bloqué', className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' };
  }
  if (!event.is_published) {
    return { label: 'Brouillon', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
  }
  const date = event.event_date ? new Date(event.event_date) : null;
  if (date && !Number.isNaN(date.getTime())) {
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    if (Date.now() > end.getTime()) {
      return { label: 'Terminée', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };
    }
  }
  return { label: 'Publiée', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [events, setEvents] = useState<EventWithSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<EventWithSettings | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [needsPermission, setNeedsPermission] = useState(false);
  const [guestCounts, setGuestCounts] = useState<Record<string, { total: number; confirmed: number; pending: number }>>({});
  const organizerUnlocked = useOrganizerUnlocked();

  // Charger les événements
  const loadEvents = useCallback(async () => {
    if (!user?.id) return;
    if (!isSupabaseReady()) {
      setEvents([]);
      setCreateError(SUPABASE_REQUIRED);
      setLoading(false);
      return;
    }

    try {
      const rows = await listInvitations(createClient(), user.id);
      setEvents(rows);
      const ids = rows.map((row) => row.id);
      if (ids.length > 0) {
        const { data } = await createClient()
          .from('guests')
          .select('event_id, status')
          .in('event_id', ids);
        const next: Record<string, { total: number; confirmed: number; pending: number }> = {};
        for (const row of data || []) {
          const bucket = next[row.event_id] || { total: 0, confirmed: 0, pending: 0 };
          bucket.total += 1;
          if (row.status === 'confirmed') bucket.confirmed += 1;
          else if (row.status !== 'declined') bucket.pending += 1;
          next[row.event_id] = bucket;
        }
        setGuestCounts(next);
      } else {
        setGuestCounts({});
      }
    } catch (err) {
      console.error('Erreur chargement Supabase:', err);
      setEvents([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    loadEvents();
  }, [authLoading, loadEvents]);

  // Créer un événement
  const handleCreateEvent = async () => {
    setCreateError('');
    if (!newEventName.trim()) {
      setCreateError('Veuillez saisir un nom d\'événement.');
      return;
    }
    if (!user?.id) {
      setCreateError('Vous devez être connecté pour créer un événement. Rafraîchissez la page.');
      return;
    }
    const already = await ownedEventCount(createClient(), user.id);
    if ((already ?? events.length) >= FREE_EVENT_LIMIT) {
      setNeedsPermission(true);
      setShowCreateInput(false);
      setCreateError(`Vous avez déjà ${FREE_EVENT_LIMIT} événements. Demandez la permission à l’admin pour en créer un autre.`);
      return;
    }
    setCreating(true);

    try {
      const slug = newEventName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        + '-' + Date.now().toString(36).slice(-4);

      const eventId = crypto.randomUUID();
      const localEvent: EventWithSettings = {
        id: eventId,
        slug,
        title: newEventName.trim(),
        user_id: user.id,
        type: 'wedding',
        event_date: new Date().toISOString(),
        location: '',
        is_published: false,
        guestLimit: 3,
        invitationTemplate: 'elegance',
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (!isSupabaseReady()) {
        setCreateError(SUPABASE_REQUIRED);
        setCreating(false);
        return;
      }

      const result = await publishInvitation(createClient(), localEvent);
      if (result.error) {
        setCreateError(result.error);
        setCreating(false);
        return;
      }

      setNewEventName('');
      setShowCreateInput(false);
      router.push(`/create/${slug}/edit`);
    } catch (err) {
      console.error('Erreur création:', err);
      setCreateError('Erreur lors de la création. Rafraîchissez et réessayez.');
    }
    setCreating(false);
  };

  // Supprimer un événement
  const handleDeleteEvent = async () => {
    if (!deleteTarget || !user?.id) return;
    setDeleting(true);

    try {
      if (!isSupabaseReady()) {
        setDeleting(false);
        return;
      }
      const result = await deleteInvitation(createClient(), deleteTarget.id);
      if (result.error) {
        console.error(result.error);
      }
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
        <div id="evenements" className="space-y-6">
          <InstallApp />
          {organizerUnlocked === false && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-rose-100 dark:border-gray-700">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {TRIAL_INVITATIONS} invitations d&apos;essai, puis 0,30 $ par invité
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {GUEST_PACKS.map((pack) => `${pack} invités · ${formatUsd(packTotalUsd(pack))}`).join(' · ')}. L&apos;essai s&apos;ajoute au forfait.
              </p>
              <a href="/pricing" className="inline-flex mt-3 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold">
                Voir les forfaits
              </a>
            </div>
          )}

          {/* En-tête */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mes événements</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {events.length > 0 ? `${events.length} invitation${events.length > 1 ? 's' : ''}` : 'Aucune invitation pour le moment'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push('/checkin')}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 rounded-xl font-medium text-sm"
              >
                Scanner le jour J
              </button>
              <button
                onClick={() => {
                  if (events.length >= FREE_EVENT_LIMIT) {
                    setNeedsPermission(true);
                    setShowCreateInput(false);
                    return;
                  }
                  setNeedsPermission(false);
                  setShowCreateInput(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-violet-200/40 dark:shadow-violet-900/30 hover:shadow-xl transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Créer
              </button>
            </div>
          </div>

          {/* Formulaire création rapide */}
          {needsPermission && (
            <EventPermission
              email={user?.email}
              name={typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : ''}
            />
          )}

          {showCreateInput && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              {createError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-xs text-red-600 dark:text-red-400">{createError}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="Nom de l'événement"
                  className="min-w-0 w-full sm:flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-400 outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateEvent()}
                />
                <button
                  onClick={handleCreateEvent}
                  disabled={creating}
                  className="px-5 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  {creating ? 'Création...' : 'Créer'}
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-sm border border-gray-100 dark:border-gray-700">
              <StoryArt name="welcome" alt="Illustration d'accueil" className="w-40 h-auto mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Aucune invitation pour le moment. Créez-en une, personnalisez-la, puis ajoutez vos invités. Le premier enregistrement reste un brouillon.
              </p>
              <button
                onClick={() => {
                  if (events.length >= FREE_EVENT_LIMIT) {
                    setNeedsPermission(true);
                    setShowCreateInput(false);
                    return;
                  }
                  setNeedsPermission(false);
                  setShowCreateInput(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Créer mon invitation
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => {
                const status = eventStatus(event);
                const counts = guestCounts[event.id];
                return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
                          <Heart className="w-4 h-4" />
                        </span>
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
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-950/40">
                          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{counts?.confirmed ?? 0}</p>
                          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">Confirmés</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 px-3 py-2 dark:bg-amber-950/40">
                          <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">{counts?.pending ?? 0}</p>
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-200">En attente</p>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <a
                    href={`/dashboard/invites?event=${event.id}`}
                    className="mt-4 inline-flex min-h-12 w-full flex-col items-center justify-center gap-0.5 rounded-xl bg-violet-600 px-4 py-2.5 text-center text-white shadow-md hover:bg-violet-700 active:scale-[0.99]"
                  >
                    <span className="inline-flex items-center justify-center gap-2 text-sm font-bold">
                      <Users className="w-4 h-4 shrink-0" />
                      Ajouter vos invités
                    </span>
                    <span className="text-[11px] font-medium leading-snug text-violet-100">Noms, tables et lien WhatsApp</span>
                  </a>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 mt-2">
                    <a
                      href={`/e/${event.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/30 transition"
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
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/e/${event.slug}`;
                        const text = `Tu es invité(e) à "${event.title}" ! ${url}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => setDeleteTarget(event)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition sm:ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer
                    </button>
                  </div>
                </div>
                );
              })}
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
                className="flex-1 px-4 py-3 bg-violet-700 text-white rounded-xl text-sm font-bold hover:bg-violet-800 transition disabled:opacity-50"
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