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
      <div className={isPending ? "pointer-events-none opacity-70 transition-opacity duration-200" : ""}>
        {children}
      </div>
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
      )}
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
