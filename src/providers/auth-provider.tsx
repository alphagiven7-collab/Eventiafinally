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
    let cancelled = false;

    async function init() {
      // Toujours charger le localStorage d'abord (instantané, jamais bloquant)
      const stored = localStorage.getItem('invitia_demo_user');
      if (stored && !cancelled) {
        const userData = JSON.parse(stored);
        setUser({ id: userData.id, email: userData.email, user_metadata: userData.user_metadata } as User);
        setSessionCookie(userData.id);
      }

      // Arrêter immédiatement le loading — on a déjà les données locales
      if (!cancelled) setLoading(false);

      // Si Supabase est dispo, synchroniser en arrière-plan (ne bloque jamais l'UI)
      if (!isSupabaseReady()) return;

      try {
        const supabase = createClient();

        // Race avec timeout 5s pour ne jamais bloquer
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000)
        );

        const sessionPromise = supabase.auth.getSession();
        const result = await Promise.race([sessionPromise, timeoutPromise]);

        if (result && !cancelled && result.data?.session?.user) {
          setSession(result.data.session);
          setUser(result.data.session.user);
          setSessionCookie(result.data.session.user.id);
        }

        // Écouter les changements d'auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, authSession) => {
            if (cancelled) return;
            setUser(authSession?.user ?? null);
            setSession(authSession);
            if (authSession?.user) {
              setSessionCookie(authSession.user.id);
            } else {
              clearSessionCookie();
            }
          }
        );

        return () => {
          cancelled = true;
          subscription.unsubscribe();
        };
      } catch {
        // Supabase injoignable — on garde les données localStorage déjà chargées
      }
    }

    init();
    return () => { cancelled = true; };
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
      // Mode démo localStorage
      const users = JSON.parse(localStorage.getItem('invitia_demo_users') || '[]');
      const found = users.find((u: any) => u.email === email && u.password === password);
      if (!found) return { error: 'Email ou mot de passe incorrect (mode démo).' };
      const { password: _, ...userData } = found;
      localStorage.setItem('invitia_demo_user', JSON.stringify(userData));
      setSessionCookie(userData.id);
      window.location.href = '/dashboard';
      return { error: null };
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
      // Mode démo localStorage
      const users = JSON.parse(localStorage.getItem('invitia_demo_users') || '[]');
      if (users.find((u: any) => u.email === email)) {
        return { error: 'Cet email est déjà utilisé (mode démo).' };
      }
      const newUser = {
        id: 'demo_' + Date.now(),
        email,
        user_metadata: { name },
        created_at: new Date().toISOString(),
      };
      users.push({ ...newUser, password });
      localStorage.setItem('invitia_demo_users', JSON.stringify(users));
      localStorage.setItem('invitia_demo_user', JSON.stringify(newUser));
      setSessionCookie(newUser.id);
      window.location.href = '/dashboard';
      return { error: null };
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
    localStorage.removeItem('invitia_demo_user');
    clearSessionCookie();
    window.location.href = '/';
  };

  return { login, signup, logout, user, session };
}