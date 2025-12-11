"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function useSession(options?: { or?: "redirect" }) {
  const router = useRouter()

  useEffect(() => {
    if (options?.or === "redirect") {
      // Verificar se há sessão via fetch
      fetch("/api/auth/session")
        .then((res) => res.json())
        .then((session) => {
          if (!session || !session.user) {
            router.push("/login")
          }
        })
        .catch(() => {
          router.push("/login")
        })
    }
  }, [options, router])

  return null
}
