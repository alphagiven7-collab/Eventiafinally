'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Event {
  id: string;
  slug: string;
  title: string;
  event_date: string;
  location: string;
  created_at: string;
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setEvents(data || []);
        }
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mes événements</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gérez vos invitations</p>
          </div>
          <Link href="/create">
            <button className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition">
              + Nouvel événement
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Aucun événement pour le moment</p>
            <Link href="/create" className="text-emerald-600 hover:underline text-sm font-medium">
              Créer votre première invitation
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Link key={event.id} href={`/create/${event.slug}/edit`}>
                <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition cursor-pointer">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">{event.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{event.location || 'Lieu non défini'}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{event.event_date ? new Date(event.event_date).toLocaleDateString('fr-FR') : 'Date à confirmer'}</span>
                    <span className="text-emerald-600 font-medium">Éditer →</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}