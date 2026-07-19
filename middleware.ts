import { NextRequest, NextResponse } from 'next/server';

function isSupabaseReady(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return url.startsWith('http') && !url.includes('votre_url') && key.length > 10;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get('invitia_session')?.value;

  let user = null;

  // Essayer la validation JWT Supabase si configurée
  if (isSupabaseReady()) {
    try {
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
      user = data.user;
    } catch {
      user = sessionCookie ? { id: sessionCookie } : null;
    }
  } else {
    user = sessionCookie ? { id: sessionCookie } : null;
  }

  if (pathname.startsWith('/auth/')) {
    if (user) return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.next();
  }

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