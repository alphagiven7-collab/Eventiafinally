import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Users, Calendar, CreditCard } from 'lucide-react';

export default async function AdminPage() {
  const { supabase, user } = await createClient();

  // Vérifier si admin
  const { data: admin } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user?.id)
    .single();

  if (!admin) {
    redirect('/dashboard');
  }

  // Stats
  const { count: eventsCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true });

  const { count: usersCount } = await supabase
    .from('auth.users')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard Super Admin</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <Calendar className="w-8 h-8 text-emerald-600 mb-2" />
          <h3 className="font-semibold">Événements</h3>
          <p className="text-2xl font-bold">{eventsCount || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow">
          <Users className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="font-semibold">Utilisateurs</h3>
          <p className="text-2xl font-bold">{usersCount || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow">
          <CreditCard className="w-8 h-8 text-purple-600 mb-2" />
          <h3 className="font-semibold">Revenus</h3>
          <p className="text-2xl font-bold">À implémenter</p>
        </div>
      </div>
      
      <a href="/dashboard" className="mt-8 inline-block text-emerald-600 hover:underline">
        ← Retour au dashboard
      </a>
    </div>
  );
}