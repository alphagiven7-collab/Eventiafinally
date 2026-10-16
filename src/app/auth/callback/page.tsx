'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';
import { safeNextPath } from '@/lib/auth/redirect';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Connexion en cours...');

  useEffect(() => {
    if (!isSupabaseReady()) {
      router.replace('/auth/login');
      return;
    }

    const nextPath = safeNextPath(searchParams.get('redirect'));
    const code = searchParams.get('code');
    const supabase = createClient();
    let cancelled = false;

    async function finish() {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          setMessage('Le lien de connexion a expiré. Demandez-en un nouveau.');
          window.setTimeout(() => router.replace('/auth/login'), 1800);
          return;
        }
      }
      router.replace(nextPath);
      router.refresh();
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-gray-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] dark:bg-gray-950" />}>
      <CallbackContent />
    </Suspense>
  );
}
