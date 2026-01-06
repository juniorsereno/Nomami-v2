/**
 * Cache simples em memória com TTL (Time To Live)
 * Útil para cachear métricas e dados que não mudam frequentemente
 */

interface CacheItem<T> {
  data: T;
  expires: number;
}

const cache = new Map<string, CacheItem<unknown>>();

/**
 * Busca um item do cache
 * @param key Chave do cache
 * @returns Dados cacheados ou null se não existir ou expirou
 */
export function getCached<T>(key: string): T | null {
  const item = cache.get(key) as CacheItem<T> | undefined;
  
  if (!item) {
    return null;
  }
  
  // Verifica se expirou
  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
}

/**
 * Armazena um item no cache
 * @param key Chave do cache
 * @param data Dados a serem cacheados
 * @param ttlSeconds Tempo de vida em segundos
 */
export function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Remove um item do cache
 * @param key Chave do cache
 */
export function clearCache(key: string): void {
  cache.delete(key);
}

/**
 * Remove todos os itens do cache
 */
export function clearAllCache(): void {
  cache.clear();
}

/**
 * Remove itens expirados do cache (limpeza)
 */
export function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now > item.expires) {
      cache.delete(key);
    }
  }
}

// Limpar cache expirado a cada 5 minutos
if (typeof window === 'undefined') {
  setInterval(cleanExpiredCache, 5 * 60 * 1000);
}
