import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseReady } from '@/config/supabase';

/** Lecture publique, sans session navigateur. Utilisé côté serveur pour l’invitation. */
export function createPublicClient(): SupabaseClient | null {
  if (!isSupabaseReady()) return null;
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
