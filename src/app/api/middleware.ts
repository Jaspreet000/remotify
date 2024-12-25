import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const token = authHeader.split(' ')[1];
  try {
    verifyToken(token);
  } catch {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile', '/dashboard'],
};
