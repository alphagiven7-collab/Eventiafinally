import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Routes publiques (login, register)
  if (pathname.startsWith('/auth/')) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return response;
  }

  // Routes protégées
  const protectedRoutes = ['/profile', '/dashboard', '/admin', '/checkin', '/create'];
  const isProtected = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Vérification admin pour /admin
  if (pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profile?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|data|assets|e/).*)'],
};