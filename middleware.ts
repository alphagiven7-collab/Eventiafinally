import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Créer un client Supabase SSR pour vérifier le JWT
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Read-only dans le middleware
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Routes publiques (login, register) → rediriger si déjà connecté
  if (pathname.startsWith('/auth/')) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Routes protégées
  const protectedRoutes = ['/profile', '/dashboard', '/admin', '/checkin', '/create'];
  const isProtected = protectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/checkin/:path*',
    '/create/:path*',
    '/auth/:path*',
  ],
};