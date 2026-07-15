'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/SupabaseProvider';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!user?.id) return;
    
    const loadProfile = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(data);
    };
    
    loadProfile();
  }, [user?.id, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Mon Profil</h1>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <p className="text-gray-900 dark:text-white font-medium">{user?.email}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-500">Nom</label>
            <p className="text-gray-900 dark:text-white font-medium">{profile?.full_name || user?.user_metadata?.name || '-'}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-500">Rôle</label>
            <span className={`inline-block px-2 py-1 text-xs rounded-full ml-2 ${
              profile?.role === 'super_admin' 
                ? 'bg-red-100 text-red-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {profile?.role === 'super_admin' ? 'Super Admin' : 'Organisateur'}
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full mt-8 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 transition"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}