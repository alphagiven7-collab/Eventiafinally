'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';
import { useAuth } from '@/providers/auth-provider';
import AdminAccess from '@/components/admin/AdminAccess';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const [status, setStatus] = useState<'checking' | 'allowed' | 'blocked'>('checking');
  const [retry, setRetry] = useState(0);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!requireAdmin) {
      setStatus('allowed');
      return;
    }

    if (!isSupabaseReady()) {
      setStatus('blocked');
      return;
    }

    let cancelled = false;
    const supabase = createClient();
    supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setStatus(data?.role === 'super_admin' ? 'allowed' : 'blocked');
      });

    return () => {
      cancelled = true;
    };
  }, [user, router, requireAdmin, authLoading, retry]);

  if (authLoading || status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (requireAdmin && status === 'blocked') {
    return (
      <AdminAccess
        email={user?.email}
        onRetry={() => {
          setStatus('checking');
          setRetry((count) => count + 1);
        }}
      />
    );
  }

  return <>{children}</>;
}
