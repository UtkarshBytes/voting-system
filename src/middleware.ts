import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const { pathname } = req.nextUrl;

  // Paths that require authentication
  const protectedPaths = ['/dashboard', '/vote', '/results'];
  const adminPaths = ['/admin/dashboard'];

  // Paths that should redirect to dashboard if already logged in
  const authPaths = ['/login', '/register', '/admin/login', '/admin/register'];

  // Check if current path is protected
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path));
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));

  let user = null;
  if (token) {
    user = await verifyToken(token);
  }

  // 1. Redirect to login if accessing protected route without token
  if ((isProtected || isAdminPath) && !user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 2. Redirect to dashboard if accessing auth pages while logged in
  if (isAuthPath && user) {
    if (user.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // 3. Admin role check
  if (isAdminPath && user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url)); // Redirect unauthorized admins to user dashboard
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/vote/:path*',
    '/results/:path*',
    '/admin/dashboard/:path*',
    '/login',
    '/register',
    '/admin/login',
    '/admin/register'
  ],
};
