"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
}

export interface Session {
  user: SessionUser | null
  loading: boolean
}

export function useSession(options?: { or?: "redirect" }): Session {
  const router = useRouter()
  const [session, setSession] = useState<Session>({ user: null, loading: true })

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data || !data.user) {
          setSession({ user: null, loading: false })
          if (options?.or === "redirect") {
            router.push("/login")
          }
        } else {
          setSession({ 
            user: {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
            }, 
            loading: false 
          })
        }
      })
      .catch(() => {
        setSession({ user: null, loading: false })
        if (options?.or === "redirect") {
          router.push("/login")
        }
      })
  }, [options?.or, router])

  return session
}
