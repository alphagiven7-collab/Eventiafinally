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
        const { count: eventsCount, error: eventsErr } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true });

        const { count: usersCount, error: usersErr } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        const { count: guestsCount, error: guestsErr } = await supabase
          .from('guests')
          .select('*', { count: 'exact', head: true });

        const { count: rsvpsCount, error: rsvpsErr } = await supabase
          .from('rsvps')
          .select('*', { count: 'exact', head: true });

        if (eventsErr || usersErr || guestsErr || rsvpsErr) {
          console.warn('Erreur stats, utilisation des données complètes');
        }

        setStats({
          totalEvents: eventsCount || 0,
          totalUsers: usersCount || 0,
          totalGuests: guestsCount || 0,
          totalRsvps: rsvpsCount || 0,
        });

        // Charger tous les événements
        const { data: eventsData, error: eventsLoadErr } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (eventsLoadErr) console.warn('Erreur chargement événements:', eventsLoadErr);
        setEvents(eventsData || []);

        // Charger tous les utilisateurs
        const { data: usersData, error: usersLoadErr } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (usersLoadErr) console.warn('Erreur chargement utilisateurs:', usersLoadErr);
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
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard" className="text-sm text-emerald-600 hover:underline">
                  ← Dashboard
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Administration Invitia</h1>
              <p className="text-sm text-gray-500 mt-1">Vue globale de la plateforme</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                SUPER ADMIN
              </span>
              <Link href="/">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
                  Accueil
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
            {error}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <p className="text-xs text-gray-500 mb-2">Utilisateurs</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
            <p className="text-xs text-gray-400 mt-1">organisateurs</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <p className="text-xs text-gray-500 mb-2">Événements</p>
            <p className="text-3xl font-bold text-emerald-600">{stats?.totalEvents || 0}</p>
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Utilisateurs ({users.length})</h2>
            <span className="text-xs text-gray-500">
              {users.filter(u => u.role === 'super_admin').length} super admin
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{user.full_name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'super_admin' 
                          ? 'bg-red-100 text-red-700' 
                          : user.role === 'staff'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role === 'super_admin' ? 'Super Admin' : user.role === 'staff' ? 'Staff' : 'Organisateur'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Aucun utilisateur
            </div>
          )}
        </div>

        {/* Événements */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Tous les événements ({events.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créé le</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((event) => {
                  const owner = users.find(u => u.id === event.user_id);
                  return (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{event.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {owner?.email || event.user_id?.slice(0, 8) || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          event.is_published 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {event.is_published ? 'Publié' : 'Brouillon'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {event.event_date 
                          ? new Date(event.event_date).toLocaleDateString('fr-FR') 
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(event.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`/e/${event.slug}`}
                          target="_blank"
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          Voir →
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {events.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Aucun événement sur la plateforme
            </div>
          )}
        </div>
      </main>
    </div>
  );
}