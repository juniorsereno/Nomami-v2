/**
 * Configurações de cache para otimização de performance
 */

// Tempo de cache para diferentes tipos de dados (em segundos)
export const CACHE_TIMES = {
  // Dados que mudam raramente
  PARTNERS: 60 * 30, // 30 minutos
  SUBSCRIBERS: 60 * 15, // 15 minutos
  SETTINGS: 60 * 60, // 1 hora
  
  // Dados que podem mudar com mais frequência
  DASHBOARD_STATS: 60 * 5, // 5 minutos
  LOGS: 60 * 2, // 2 minutos
  
  // Sessão e autenticação
  SESSION: 60 * 30, // 30 minutos
  USER_PROFILE: 60 * 15, // 15 minutos
} as const

// Configuração de revalidação para rotas estáticas
export const REVALIDATE_TIMES = {
  STATIC_PAGES: 3600, // 1 hora
  DYNAMIC_PAGES: 300, // 5 minutos
  REALTIME_PAGES: 60, // 1 minuto
} as const

// Headers de cache para API routes
export const getCacheHeaders = (maxAge: number) => ({
  'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
})
