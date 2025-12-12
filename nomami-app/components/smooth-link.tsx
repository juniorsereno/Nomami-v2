"use client"

import { usePageTransition } from "./page-transition-provider"
import { AnchorHTMLAttributes, MouseEvent, useEffect } from "react"
import { useRouter } from "next/navigation"

interface SmoothLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  prefetch?: boolean // Habilita prefetch (padrão: true)
}

export function SmoothLink({ href, onClick, children, prefetch = true, ...props }: SmoothLinkProps) {
  const { navigate } = usePageTransition()
  const router = useRouter()

  // Prefetch da rota ao montar o componente
  useEffect(() => {
    if (prefetch) {
      router.prefetch(href)
    }
  }, [href, prefetch, router])

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    
    if (onClick) {
      onClick(e)
    }
    
    navigate(href)
  }

  // Prefetch adicional ao passar o mouse (hover)
  const handleMouseEnter = () => {
    if (prefetch) {
      router.prefetch(href)
    }
  }

  return (
    <a 
      href={href} 
      onClick={handleClick} 
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </a>
  )
}
