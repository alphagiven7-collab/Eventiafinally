// ============================================
// INVITIA - Supabase Configuration
// ============================================

export function isSupabaseReady(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return url.startsWith('http') && !url.includes('votre_url') && key.length > 10;
}