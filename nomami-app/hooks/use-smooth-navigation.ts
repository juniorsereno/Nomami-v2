"use client"

import { usePageTransition } from "@/components/page-transition-provider"

export function useSmoothNavigation() {
  const { navigate, isPending } = usePageTransition()
  
  return {
    navigate,
    isPending,
    push: navigate, // Alias para compatibilidade com router.push
  }
}
