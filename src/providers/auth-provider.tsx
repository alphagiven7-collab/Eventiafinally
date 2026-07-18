'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';
import { Session, User } from '@supabase/supabase-js';

// ============================================
// Auth Context
// ============================================

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

// ============================================
// Helper - Cookie pour le middleware
// ============================================

function setSessionCookie(value: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `invitia_session=${value}; path=/; max-age=86400; SameSite=Lax`;
}

function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'invitia_session=; path=/; max-age=0';
}

// ============================================
// Supabase Auth Provider
// ============================================

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (!isSupabaseReady()) {
        setLoading(false);
        return;
      }

      const supabase = createClient();

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        setSessionCookie(currentSession.user.id);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, authSession) => {
          setUser(authSession?.user ?? null);
          setSession(authSession);
          if (authSession?.user) {
            setSessionCookie(authSession.user.id);
          } else {
            clearSessionCookie();
          }
        }
      );

      setLoading(false);
      return () => subscription.unsubscribe();
    }

    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// Auth Actions Hook
// ============================================

export function useAuthActions() {
  const { user, session } = useAuth();

  const login = async (email: string, password: string) => {
    if (!isSupabaseReady()) {
      return { error: 'Supabase non configuré. Créez un fichier .env.local.' };
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      setSessionCookie(data.user.id);
    }
    return { error: null };
  };

  const signup = async (email: string, password: string, name: string) => {
    if (!isSupabaseReady()) {
      return { error: 'Supabase non configuré. Créez un fichier .env.local.' };
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      setSessionCookie(data.user.id);
    }
    return { error: null };
  };

  const logout = async () => {
    if (isSupabaseReady()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    clearSessionCookie();
    window.location.href = '/';
  };

  return { login, signup, logout, user, session };
}