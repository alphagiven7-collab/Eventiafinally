'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';
import { translateAuthError } from '@/lib/auth/redirect';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export const SUPABASE_REQUIRED = 'Service momentanément indisponible. Réessayez plus tard.';

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => isSupabaseReady());

  useEffect(() => {
    if (!isSupabaseReady()) return;

    let cancelled = false;
    const supabase = createClient();

    const timeout = window.setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthActions() {
  const { user, session } = useAuth();

  const login = async (email: string, password: string) => {
    if (!isSupabaseReady()) return { error: SUPABASE_REQUIRED };
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: translateAuthError(error.message) };
    return { error: null };
  };

  const signup = async (email: string, password: string, name: string) => {
    if (!isSupabaseReady()) return { error: SUPABASE_REQUIRED, needsConfirmation: false };
    if (password.length < 8) {
      return { error: 'Le mot de passe doit contenir au moins 8 caractères.', needsConfirmation: false };
    }
    const supabase = createClient();
    const redirect = `${window.location.origin}/auth/callback?redirect=/dashboard`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: redirect,
      },
    });
    if (error) return { error: translateAuthError(error.message), needsConfirmation: false };
    if (!data.session) {
      const signedIn = await supabase.auth.signInWithPassword({ email, password });
      if (signedIn.error) return { error: translateAuthError(signedIn.error.message), needsConfirmation: false };
    }
    return { error: null, needsConfirmation: false };
  };

  const logout = async () => {
    if (isSupabaseReady()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    window.location.href = '/';
  };

  const signInWithGoogle = async (nextPath = '/dashboard') => {
    if (!isSupabaseReady()) return { error: SUPABASE_REQUIRED };
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(nextPath)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) return { error: translateAuthError(error.message) };
    return { error: null };
  };

  const requestPasswordReset = async (email: string) => {
    if (!isSupabaseReady()) return { error: SUPABASE_REQUIRED };
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?redirect=/auth/update-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return { error: translateAuthError(error.message) };
    return { error: null };
  };

  const updatePassword = async (password: string) => {
    if (!isSupabaseReady()) return { error: SUPABASE_REQUIRED };
    if (password.length < 8) return { error: 'Le mot de passe doit contenir au moins 8 caractères.' };
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: translateAuthError(error.message) };
    return { error: null };
  };

  return { login, signup, logout, signInWithGoogle, requestPasswordReset, updatePassword, user, session };
}
