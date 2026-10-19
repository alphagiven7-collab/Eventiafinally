'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface PlatformStats {
  totalEvents: number;
  totalUsers: number;
  totalGuests: number;
  totalRsvps: number;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface AdminEvent {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  location: string;
  created_at: string;
  user_id: string;
  is_published: boolean;
}

export default function SuperAdminPage() {
  return (
    <ProtectedRoute requireAdmin>
      <SuperAdminContent />
    </ProtectedRoute>
  );
}

function SuperAdminContent() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPlatformData = async () => {
      try {
        const supabase = createClient();

        // Charger les statistiques
        const [eventsCountRes, usersCountRes, guestsCountRes, rsvpsCountRes] = await Promise.all([
          supabase.from('events').select('id', { count: 'exact', head: true }),
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('guests').select('id', { count: 'exact', head: true }),
          supabase.from('rsvps').select('id', { count: 'exact', head: true }),
        ]);
        const eventsCount = eventsCountRes.count;
        const usersCount = usersCountRes.count;
        const guestsCount = guestsCountRes.count;
        const rsvpsCount = rsvpsCountRes.count;
        const eventsErr = eventsCountRes.error;
        const usersErr = usersCountRes.error;
        const guestsErr = guestsCountRes.error;
        const rsvpsErr = rsvpsCountRes.error;

        const statError = [eventsErr, usersErr, guestsErr, rsvpsErr].find((item) => item);
        setStats({
          totalEvents: eventsCount || 0,
          totalUsers: usersCount || 0,
          totalGuests: guestsCount || 0,
          totalRsvps: rsvpsCount || 0,
        });

        const [{ data: eventsData, error: eventsLoadErr }, { data: usersData, error: usersLoadErr }] = await Promise.all([
          supabase.from('events').select('id, title, slug, event_date, location, created_at, user_id, is_published').order('created_at', { ascending: false }).limit(100),
          supabase.from('users').select('id, email, full_name, role, created_at').order('created_at', { ascending: false }).limit(100),
        ]);

        const loadError = eventsLoadErr || usersLoadErr || statError;
        setError(loadError ? 'Une partie des données est encore invisible. Relancez le script d’accès dans Supabase, puis vérifiez à nouveau.' : '');
        setEvents(eventsData || []);
        setUsers(usersData || []);
      } catch (error) {
        console.error('Error loading platform data:', error);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadPlatformData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 dark:bg-gray-900">
      <header className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <Link href="/dashboard" className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            Retour aux événements
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Administration</h1>
            <span className="px-3 py-1 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200 rounded-full text-xs font-bold">
              Super admin
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comptes, invitations et réponses de la plateforme</p>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
            {error}
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <p className="text-xs text-gray-500 mb-2">Utilisateurs</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
            <p className="text-xs text-gray-400 mt-1">organisateurs</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <p className="text-xs text-gray-500 mb-2">Événements</p>
            <p className="text-3xl font-bold text-violet-700">{stats?.totalEvents || 0}</p>
            <p className="text-xs text-gray-400 mt-1">créés sur la plateforme</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <p className="text-xs text-gray-500 mb-2">Invités</p>
            <p className="text-3xl font-bold text-blue-600">{stats?.totalGuests || 0}</p>
            <p className="text-xs text-gray-400 mt-1">invitations envoyées</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <p className="text-xs text-gray-500 mb-2">RSVP</p>
            <p className="text-3xl font-bold text-purple-600">{stats?.totalRsvps || 0}</p>
            <p className="text-xs text-gray-400 mt-1">réponses reçues</p>
          </div>
        </div>

        {/* Utilisateurs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Comptes ({users.length})</h2>
            <span className="text-xs text-gray-500">
              {users.filter(u => u.role === 'super_admin').length} admin
            </span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map((account) => (
              <article key={account.id} className="p-4 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{account.full_name || 'Sans nom'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 break-all">{account.email || 'Sans e-mail'}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-1 text-xs font-medium rounded-full ${
                    account.role === 'super_admin'
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {account.role === 'super_admin' ? 'Admin' : account.role === 'staff' ? 'Staff' : 'Organisateur'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {account.created_at ? new Date(account.created_at).toLocaleDateString('fr-FR') : ''}
                </p>
              </article>
            ))}
          </div>
          {users.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-500">
              Aucun compte visible pour le moment.
            </div>
          )}
        </div>

        {/* Événements */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Événements ({events.length})</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {events.map((event) => {
              const owner = users.find(u => u.id === event.user_id);
              return (
                <article key={event.id} className="p-4 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{event.title}</h3>
                    <span className={`shrink-0 px-2 py-1 text-xs font-medium rounded-full ${
                      event.is_published
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {event.is_published ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 break-all">{owner?.email || 'Organisateur inconnu'}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {event.event_date ? new Date(event.event_date).toLocaleDateString('fr-FR') : 'Date à préciser'}
                    {event.location ? ` · ${event.location}` : ''}
                  </p>
                  <a
                    href={`/e/${event.slug}`}
                    target="_blank"
                    className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-violet-700 dark:text-violet-300"
                  >
                    Ouvrir l’invitation
                  </a>
                </article>
              );
            })}
          </div>
          {events.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-500">
              Aucun événement visible pour le moment.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}