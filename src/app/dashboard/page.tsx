'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/SupabaseProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import MigrationPanel from '@/components/admin/MigrationPanel';
import { Event } from '@/types';

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Erreur chargement événements:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="user">
      <AdminLayout>
        <div className="space-y-6">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes événements</h1>
              <p className="text-gray-600 mt-1">Gérez vos invitations</p>
            </div>
            <button
              onClick={() => router.push('/create')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
            >
              Créer un événement
            </button>
          </div>

          {/* Migration des données */}
          <MigrationPanel eventId="yanick-keren" eventName="Mariage Yanick & Keren" />

          {/* Liste des événements */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
              <p className="text-gray-500 mb-4">Aucun événement pour le moment</p>
              <button
                onClick={() => router.push('/create')}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
              >
                Créer votre premier événement
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/create/${event.id}/edit`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(event.date).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{event.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                        {event.visibility || 'privé'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}