import { NextRequest, NextResponse } from 'next/server';

function isSupabaseReady(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return url.startsWith('http') && !url.includes('votre_url') && key.length > 10;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get('invitia_session')?.value;

  // Déterminer l'utilisateur avec un timeout de 5s max
  let user = null;

  if (isSupabaseReady()) {
    try {
      // Race entre Supabase et un timeout de 5 secondes
      const supabasePromise = (async () => {
        const { createServerClient } = await import('@supabase/ssr');
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() { return request.cookies.getAll(); },
              setAll() {},
            },
          }
        );
        const { data } = await supabase.auth.getUser();
        return data.user;
      })();

      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 5000)
      );

      user = await Promise.race([supabasePromise, timeoutPromise]);
    } catch {
      // Supabase injoignable ou import échoué → fallback cookie
      user = sessionCookie ? { id: sessionCookie } : null;
    }
  } else {
    // Supabase non configuré → fallback cookie
    user = sessionCookie ? { id: sessionCookie } : null;
  }

  // Pages d'auth : rediriger vers dashboard si déjà connecté
  if (pathname.startsWith('/auth/')) {
    if (user) return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.next();
  }

  // Routes protégées : rediriger vers login si pas connecté
  const protectedRoutes = ['/profile', '/dashboard', '/admin', '/checkin', '/create'];
  const isProtected = protectedRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'));

  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/dashboard/:path*', '/admin/:path*', '/checkin/:path*', '/create/:path*', '/auth/:path*'],
};