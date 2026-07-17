import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get('invitia_session')?.value;

  // Routes publiques (login, register)
  if (pathname.startsWith('/auth/')) {
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Routes protégées
  const protectedRoutes = ['/profile', '/dashboard', '/admin', '/checkin', '/create'];
  const isProtected = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/dashboard/:path*', '/admin/:path*', '/checkin/:path*', '/create/:path*', '/auth/:path*'],
};
