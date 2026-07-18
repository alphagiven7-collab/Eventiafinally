'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/auth-provider';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const checkAdmin = async () => {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.role === 'super_admin') {
        setIsAdmin(true);
      }
    };
    checkAdmin();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-emerald-600 hover:text-emerald-700 text-sm">
              ← Accueil
            </Link>
            <Link href="/dashboard" className="text-emerald-600 hover:text-emerald-700 text-sm">
              Dashboard
            </Link>
            {isAdmin && (
              <Link href="/admin" className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-bold transition">
                ⚡ Admin
              </Link>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {isAdmin ? '👑 Super Admin' : 'Organisateur'}
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
