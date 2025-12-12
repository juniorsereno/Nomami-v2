"use client"

import { useEffect, useRef, useCallback } from "react"
import { signOut } from "next-auth/react"
import { useSmoothNavigation } from "@/hooks/use-smooth-navigation"

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutos em milissegundos

export function SessionTimeout() {
  const { navigate } = useSmoothNavigation()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      await signOut({ redirect: false })
      navigate("/login")
    }, INACTIVITY_TIMEOUT)
  }, [navigate])

  useEffect(() => {
    // Eventos que resetam o timeout
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"]

    const handleActivity = () => {
      resetTimeout()
    }

    // Adicionar listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity)
    })

    // Iniciar timeout
    resetTimeout()

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [resetTimeout])

  return null
}
