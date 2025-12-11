"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutos em milissegundos

export function SessionTimeout() {
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout>()

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      await signOut({ redirect: false })
      router.push("/login")
    }, INACTIVITY_TIMEOUT)
  }

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
  }, [])

  return null
}
