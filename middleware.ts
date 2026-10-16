import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isSupabaseReady } from '@/config/supabase';
import { safeNextPath } from '@/lib/auth/redirect';

const PROTECTED = ['/profile', '/dashboard', '/admin', '/checkin', '/create'];

function isProtected(pathname: string) {
  return PROTECTED.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function withSessionCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  return target;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let response = NextResponse.next({ request });

  if (!isSupabaseReady()) {
    if (isProtected(pathname)) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (pathname.startsWith('/auth/callback') || pathname.startsWith('/auth/update-password')) {
    return response;
  }

  if ((pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/auth/forgot') && user) {
    const next = safeNextPath(request.nextUrl.searchParams.get('redirect'));
    return withSessionCookies(response, NextResponse.redirect(new URL(next, request.url)));
  }

  if (isProtected(pathname) && !user) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return withSessionCookies(response, NextResponse.redirect(loginUrl));
  }

  return response;
}

export const config = {
  matcher: ['/profile/:path*', '/dashboard/:path*', '/admin/:path*', '/checkin/:path*', '/create/:path*', '/auth/:path*'],
};
