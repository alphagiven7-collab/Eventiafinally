'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/providers/auth-provider';

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
  const [phone, setPhone] = useState('');
  const [phoneNotice, setPhoneNotice] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
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
      setPhone(data?.phone || '');
    };
    
    loadProfile();
  }, [user?.id, supabase]);

  const savePhone = async () => {
    if (!user?.id) return;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) {
      setPhoneNotice('Indiquez le numéro avec l’indicatif du pays, sans espaces.');
      return;
    }
    setSavingPhone(true);
    const { error } = await supabase.from('users').update({ phone: digits }).eq('id', user.id);
    setSavingPhone(false);
    setPhoneNotice(error ? 'Le numéro n’a pas été enregistré.' : 'Numéro WhatsApp enregistré.');
    if (!error) setPhone(digits);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <AdminLayout>
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Mon Profil</h1>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <p className="text-gray-900 dark:text-white font-medium">{user?.email}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-500">Nom</label>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '-'}
            </p>
          </div>
          
          <div>
            <label htmlFor="admin-whatsapp" className="text-sm text-gray-500">WhatsApp</label>
            <input
              id="admin-whatsapp"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Indicatif pays, puis le numéro"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              {profile?.role === 'super_admin'
                ? 'Les organisateurs écrivent à ce numéro depuis la page Offres.'
                : 'Votre numéro de contact.'}
            </p>
            <button
              type="button"
              onClick={() => void savePhone()}
              disabled={savingPhone}
              className="mt-2 min-h-12 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white"
            >
              {savingPhone ? 'Enregistrement…' : 'Enregistrer le numéro'}
            </button>
            {phoneNotice && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{phoneNotice}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-500">Rôle</label>
            <span className={`inline-block px-2 py-1 text-xs rounded-full ml-2 ${
              profile?.role === 'super_admin' 
                ? 'bg-violet-100 text-violet-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {profile?.role === 'super_admin' ? 'Admin' : 'Organisateur'}
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
    </AdminLayout>
  );
}