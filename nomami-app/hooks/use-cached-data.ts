"use client"

import { useEffect, useState, useCallback } from "react"

interface CacheOptions {
  ttl?: number // Time to live em segundos
  key: string
}

interface CachedData<T> {
  data: T
  timestamp: number
}

/**
 * Hook para cache de dados no localStorage com TTL
 * Útil para dados que não mudam frequentemente
 */
export function useCachedData<T>(
  fetchFn: () => Promise<T>,
  options: CacheOptions
) {
  const { key, ttl = 300 } = options // 5 minutos padrão
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const getCachedData = useCallback((): T | null => {
    if (typeof window === "undefined") return null
    
    try {
      const cached = localStorage.getItem(key)
      if (!cached) return null

      const { data, timestamp }: CachedData<T> = JSON.parse(cached)
      const now = Date.now()
      const age = (now - timestamp) / 1000 // idade em segundos

      if (age > ttl) {
        localStorage.removeItem(key)
        return null
      }

      return data
    } catch {
      return null
    }
  }, [key, ttl])

  const setCachedData = useCallback((newData: T) => {
    if (typeof window === "undefined") return
    
    try {
      const cached: CachedData<T> = {
        data: newData,
        timestamp: Date.now(),
      }
      localStorage.setItem(key, JSON.stringify(cached))
    } catch (err) {
      console.error("Erro ao salvar cache:", err)
    }
  }, [key])

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    setError(null)

    try {
      // Tenta usar cache primeiro
      if (!forceRefresh) {
        const cached = getCachedData()
        if (cached) {
          setData(cached)
          setLoading(false)
          return cached
        }
      }

      // Busca dados frescos
      const freshData = await fetchFn()
      setData(freshData)
      setCachedData(freshData)
      return freshData
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro desconhecido"))
      return null
    } finally {
      setLoading(false)
    }
  }, [fetchFn, getCachedData, setCachedData])

  const invalidate = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key)
    }
    fetchData(true)
  }, [key, fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    invalidate,
  }
}
