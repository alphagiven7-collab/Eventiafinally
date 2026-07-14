'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/SupabaseProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredRole?: string;
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requiredRole
}: ProtectedRouteProps) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      // Si useAuth n'a pas encore chargé l'utilisateur
      if (authLoading) {
        return;
      }

      // Pas d'utilisateur connecté → rediriger vers login
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Vérifier si on a besoin d'un super admin
      if (requireAdmin) {
        const supabase = createClient();
        
        // Vérifier d'abord dans users (créé par le seed)
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        
        if (userProfile?.role === 'super_admin') {
          // OK - authorized
        } else {
          // Fallback: vérifier dans admin_users (ancienne table)
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

          if (adminUser?.role !== 'super_admin') {
            router.push('/dashboard');
            return;
          }
        }
      }

      // Si un requiredRole est spécifié, vérifier dans la table users
      if (requiredRole) {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        // Si l'utilisateur n'a pas de profil ou que le rôle ne correspond pas
        if (!profile) {
          // Créer le profil utilisateur s'il n'existe pas
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.name || '',
              role: 'organizer',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('Erreur création profil:', insertError);
          }
        } else if (profile.role !== requiredRole && profile.role !== 'super_admin') {
          // Si le rôle est insuffisant et pas super_admin
          router.push('/');
          return;
        }
      }

      setAuthorized(true);
    };

    checkAuth();
  }, [user, router, requireAdmin, requiredRole, authLoading]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}