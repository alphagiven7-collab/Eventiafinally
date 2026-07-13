'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PlatformStats {
  totalEvents: number;
  totalUsers: number;
  totalGuests: number;
  totalRsvps: number;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  location: string;
  created_at: string;
  user_id: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
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
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlatformData = async () => {
      try {
        const supabase = createClient();

        // Vérifier si l'utilisateur est super admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'super_admin') {
          console.warn('Access denied: not a super admin');
          return;
        }

        // Charger les statistiques
        const [eventsCount, usersCount, guestsCount, rsvpsCount] = await Promise.all([
          supabase.from('events').select('*', { count: 'exact' }),
          supabase.from('users').select('*', { count: 'exact' }),
          supabase.from('guests').select('*', { count: 'exact' }),
          supabase.from('rsvps').select('*', { count: 'exact' }),
        ]);

        setStats({
          totalEvents: eventsCount.count || 0,
          totalUsers: usersCount.count || 0,
          totalGuests: guestsCount.count || 0,
          totalRsvps: rsvpsCount.count || 0,
        });

        // Charger tous les événements
        const { data: eventsData } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        setEvents(eventsData || []);

        // Charger tous les utilisateurs
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        setUsers(usersData || []);
      } catch (error) {
        console.error('Error loading platform data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlatformData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Super Admin Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Vue globale de la plateforme</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Utilisateurs</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalUsers || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Événements</p>
            <p className="text-3xl font-bold text-emerald-600">{stats?.totalEvents || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Invités</p>
            <p className="text-3xl font-bold text-blue-600">{stats?.totalGuests || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">RSVP</p>
            <p className="text-3xl font-bold text-purple-600">{stats?.totalRsvps || 0}</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Utilisateurs récents</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'super_admin' 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Événements récents</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Titre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Lieu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Créé le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{event.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{event.location || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {event.event_date ? new Date(event.event_date).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(event.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
