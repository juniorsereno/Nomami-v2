"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { SessionTimeout } from "./session-timeout"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <SessionTimeout />
      {children}
    </NextAuthSessionProvider>
  )
}
