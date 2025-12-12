"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { SessionTimeout } from "./session-timeout"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider 
      refetchInterval={30 * 60} // 30 minutos - cache mais longo
      refetchOnWindowFocus={false} // Desabilita revalidação ao focar janela
    >
      <SessionTimeout />
      {children}
    </NextAuthSessionProvider>
  )
}
