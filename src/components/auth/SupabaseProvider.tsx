'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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

interface SupabaseProviderProps {
  children: React.ReactNode;
}

// Helper cookie pour le middleware
function setSessionCookie(value: string) {
  document.cookie = `invitia_session=${value}; path=/; max-age=86400; SameSite=Lax`;
}
function clearSessionCookie() {
  document.cookie = 'invitia_session=; path=/; max-age=0';
}

// Vérifie si Supabase est configuré
function isSupabaseReady(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return url.startsWith('http') && !url.includes('votre_url') && key.length > 10;
}

export default function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (isSupabaseReady()) {
        // Mode Supabase réel
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          setSessionCookie(session.user.id);
        }
      } else {
        // Mode démo : restaurer depuis localStorage
        const stored = localStorage.getItem('invitia_user');
        if (stored) {
          const userData = JSON.parse(stored);
          setUser(userData);
          setSessionCookie(userData.id);
        }
      }
      setLoading(false);
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

// Fonctions exportées pour login/signup/logout
export function useAuthActions() {
  const { user, session } = useAuth();

  const login = async (email: string, password: string) => {
    if (isSupabaseReady()) {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        setSessionCookie(data.user.id);
        localStorage.setItem('invitia_user', JSON.stringify(data.user));
      }
      return { error: null };
    }
    // Mode démo
    const users = JSON.parse(localStorage.getItem('invitia_users') || '[]');
    const found = users.find((u: any) => u.email === email && u.password === password);
    if (!found) return { error: 'Email ou mot de passe incorrect' };
    const { password: _, ...userData } = found;
    localStorage.setItem('invitia_user', JSON.stringify(userData));
    setSessionCookie(userData.id);
    window.location.href = '/dashboard';
    return { error: null };
  };

  const signup = async (email: string, password: string, name: string) => {
    if (isSupabaseReady()) {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } },
      });
      if (error) return { error: error.message };
      if (data.user) {
        setSessionCookie(data.user.id);
        localStorage.setItem('invitia_user', JSON.stringify(data.user));
      }
      return { error: null };
    }
    // Mode démo
    const users = JSON.parse(localStorage.getItem('invitia_users') || '[]');
    if (users.find((u: any) => u.email === email)) {
      return { error: 'Cet email est déjà utilisé' };
    }
    const newUser = {
      id: 'user_' + Date.now(),
      email,
      user_metadata: { name },
      created_at: new Date().toISOString(),
    };
    users.push({ ...newUser, password });
    localStorage.setItem('invitia_users', JSON.stringify(users));
    localStorage.setItem('invitia_user', JSON.stringify(newUser));
    setSessionCookie(newUser.id);
    window.location.href = '/dashboard';
    return { error: null };
  };

  const logout = async () => {
    if (isSupabaseReady()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    localStorage.removeItem('invitia_user');
    clearSessionCookie();
    window.location.href = '/';
  };

  return { login, signup, logout, user, session };
}