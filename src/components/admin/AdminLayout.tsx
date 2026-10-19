'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth, useAuthActions } from '@/providers/auth-provider';
import { usePathname } from 'next/navigation';
import { LogOut, User, Settings, Sun, Moon, LayoutDashboard, CalendarDays, Users, CircleUser } from 'lucide-react';
import { useTheme } from 'next-themes';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const { logout } = useAuthActions();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user?.id) return;
    const checkAdmin = async () => {
      try {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.role === 'super_admin') {
          setIsAdmin(true);
        }
      } catch {
        // Ignore — mode localStorage
      }
    };
    checkAdmin();
  }, [user?.id]);

  const handleLogout = async () => {
    await logout();
  };

  const pathname = usePathname();
  const [hash, setHash] = useState('');
  const nav = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/dashboard#evenements', label: 'Événements', icon: CalendarDays },
    { href: '/dashboard/invites', label: 'Invités', icon: Users },
    { href: '/profile', label: 'Profil', icon: CircleUser },
  ];

  useEffect(() => {
    const read = () => setHash(window.location.hash);
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/dashboard#evenements') return pathname === '/dashboard' && hash === '#evenements';
    if (href === '/dashboard') return pathname === '/dashboard' && hash !== '#evenements';
    if (href === '/dashboard/invites') return pathname.startsWith('/dashboard/invites');
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="font-bold text-gray-900 dark:text-white text-sm">
              Invitia
            </Link>
            {isAdmin && (
              <Link href="/admin" className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-3 py-1 rounded-lg text-xs font-bold transition">
                ⚡ Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            {mounted && (
              <button
                onClick={() => {
                  const next = theme === 'dark' ? 'light' : 'dark';
                  setTheme(next);
                  try {
                    localStorage.setItem('invitia_theme', next);
                    localStorage.setItem('theme', next);
                  } catch {}
                  window.dispatchEvent(new CustomEvent('invitia-theme-change', { detail: next }));
                }}
                className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                aria-label="Changer le thème"
                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {/* Menu utilisateur */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm text-gray-700 dark:text-gray-200"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {user?.email || user?.user_metadata?.name || 'Utilisateur'}
                </span>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {user?.user_metadata?.name || user?.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {isAdmin ? '👑 Super Admin' : 'Organisateur'}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Mon profil
                      </Link>
                      <button
                        onClick={() => { setMenuOpen(false); handleLogout(); }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 min-h-[calc(100vh-57px)] p-4">
          <nav className="space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive(item.href)
                    ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 min-h-14 py-2 text-[11px] font-semibold ${
                isActive(item.href) ? 'text-violet-700' : 'text-gray-500'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
