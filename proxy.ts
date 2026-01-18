import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const authCookie = request.cookies.get('auth');
  const { pathname } = request.nextUrl;

  // Public paths yang bisa diakses tanpa login
  const publicPaths = ['/'];
  
  // Cek apakah path adalah public path
  const isPublicPath = publicPaths.includes(pathname);

  // Jika sudah login dan akses halaman login, redirect ke dashboard
  if (authCookie && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Jika belum login dan akses halaman yang butuh auth, redirect ke login
  if (!authCookie && !isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};