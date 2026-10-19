'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';
import { isFreeGuestTier } from '@/lib/pricing/tier';

/** Vrai si l’organisateur a au moins un événement débloqué (limite au-delà de l’essai). */
export function useOrganizerUnlocked(): boolean | null {
  const { user, loading } = useAuth();
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user?.id || !isSupabaseReady()) {
      setUnlocked(false);
      return;
    }
    let cancelled = false;
    void createClient()
      .from('events')
      .select('guest_limit')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setUnlocked(false);
          return;
        }
        const paid = (data || []).some((row) => !isFreeGuestTier(row.guest_limit));
        setUnlocked(paid);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, loading]);

  return unlocked;
}
