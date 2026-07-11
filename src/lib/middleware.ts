import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { supabase, user } = await createClient();

  // Routes protégées nécessitant authentification
  const protectedRoutes = ['/create', '/dashboard', '/admin'];
  const pathname = request.nextUrl.pathname;

  // Vérifier si la route est protégée
  const isProtected = protectedRoutes.some(route => 
    pathname.startsWith(route) || pathname.startsWith('/create/')
  );

  if (isProtected && !user) {
    // Rediriger vers login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};