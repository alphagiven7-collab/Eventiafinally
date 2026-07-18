'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false,
}: ProtectedRouteProps) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Vérifier admin via localStorage (mode démo)
    if (requireAdmin) {
      const stored = localStorage.getItem('invitia_user');
      if (stored) {
        const userData = JSON.parse(stored);
        if (userData.role !== 'super_admin') {
          router.push('/dashboard');
          return;
        }
      } else {
        router.push('/dashboard');
        return;
      }
    }

    setAuthorized(true);
  }, [user, router, requireAdmin, authLoading]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}