import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from './lib/logger';
import { auth } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { method, url, nextUrl } = request;
  
  // Ignorar arquivos estáticos e internos do Next.js para não poluir logs
  if (
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/favicon.ico') ||
    nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)
  ) {
    return NextResponse.next();
  }

  logger.info(
    {
      req: {
        method,
        url,
        pathname: nextUrl.pathname,
        ip: (request as unknown as { ip?: string }).ip || request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
      },
    },
    `Incoming Request: ${method} ${nextUrl.pathname}`
  );

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/first-access', '/api/auth', '/parceiros', '/card'];
  const isPublicRoute = publicRoutes.some(route => nextUrl.pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Verificar autenticação para rotas protegidas
  const session = await auth();
  
  if (!session && !nextUrl.pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};