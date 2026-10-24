'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';
import { safeNextPath } from '@/lib/auth/redirect';
import { finishBrowserSignIn } from '@/lib/auth/callback';
import Link from 'next/link';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const nextPath = safeNextPath(searchParams.get('redirect'));

  useEffect(() => {
    if (!isSupabaseReady()) {
      router.replace('/auth/login');
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    async function finish() {
      const result = await finishBrowserSignIn(supabase.auth);
      if (cancelled) return;
      if (result.error) {
        setError(result.error);
        return;
      }
      router.replace(nextPath);
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [router, nextPath]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-gray-950">
      <div className="text-center max-w-md px-4">
        {!error && <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />}
        <p role={error ? 'alert' : 'status'} className="text-sm text-gray-500 dark:text-gray-400">
          {error || 'Connexion en cours...'}
        </p>
        {error && (
          <Link href={`/auth/login?redirect=${encodeURIComponent(nextPath)}`} className="mt-4 inline-flex rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white">
            Revenir à la connexion
          </Link>
        )}
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
