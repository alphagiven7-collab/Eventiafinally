'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseReady()) {
      router.push('/auth/login');
      return;
    }

    const supabase = createClient();

    // Écouter les changements d'auth pour capturer la session OAuth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Définir le cookie pour le middleware
        document.cookie = `invitia_session=${session.user.id}; path=/; max-age=86400; SameSite=Lax`;
        router.push('/dashboard');
      }
    });

    // Aussi vérifier immédiatement si une session existe déjà
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        document.cookie = `invitia_session=${session.user.id}; path=/; max-age=86400; SameSite=Lax`;
        router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-gray-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Connexion en cours...</p>
      </div>
    </div>
  );
}