"use client"

import { createContext, useContext, useTransition, ReactNode } from "react"
import { useRouter } from "next/navigation"

interface PageTransitionContextType {
  isPending: boolean
  startTransition: (callback: () => void) => void
  navigate: (url: string) => void
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined)

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const navigate = (url: string) => {
    startTransition(() => {
      router.push(url)
    })
  }

  return (
    <PageTransitionContext.Provider value={{ isPending, startTransition, navigate }}>
      {children}
    </PageTransitionContext.Provider>
  )
}

export function usePageTransition() {
  const context = useContext(PageTransitionContext)
  if (!context) {
    throw new Error("usePageTransition must be used within PageTransitionProvider")
  }
  return context
}
