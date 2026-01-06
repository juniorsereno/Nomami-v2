import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from './lib/logger';
import { auth } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { method, url, nextUrl } = request;
  const isProd = process.env.NODE_ENV === 'production';
  
  // Ignorar arquivos estáticos e internos do Next.js para não poluir logs
  if (
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/favicon.ico') ||
    nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)
  ) {
    return NextResponse.next();
  }

  // Em produção, logar apenas rotas importantes (não APIs de métricas frequentes)
  const shouldLog = !isProd || (
    !nextUrl.pathname.startsWith('/api/metrics') &&
    !nextUrl.pathname.startsWith('/api/health')
  );

  if (shouldLog) {
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
  }

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    '/login', 
    '/first-access', 
    '/api/auth', 
    '/api/webhook', // Webhooks externos (Asaas, Stripe, etc)
    '/api/whatsapp/test-cadence', // Rota de teste temporária
    '/api/health', // Health check
    '/parceiros', 
    '/card'
  ];
  const isPublicRoute = publicRoutes.some(route => nextUrl.pathname.startsWith(route));

  if (isPublicRoute) {
    if (shouldLog) {
      logger.info(`Public route accessed: ${nextUrl.pathname}`);
    }
    return NextResponse.next();
  }

  // Verificar autenticação para rotas protegidas
  const session = await auth();
  
  if (shouldLog) {
    logger.info({
      pathname: nextUrl.pathname,
      hasSession: !!session,
      hasUser: !!session?.user,
    }, 'Session check');
  }
  
  if (!session || !session.user) {
    if (shouldLog) {
      logger.info('No valid session found, redirecting to login');
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    return response;
  }

  if (shouldLog) {
    logger.info(`Authenticated access to: ${nextUrl.pathname}`);
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