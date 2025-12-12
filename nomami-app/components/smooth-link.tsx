"use client"

import { usePageTransition } from "./page-transition-provider"
import { AnchorHTMLAttributes, MouseEvent } from "react"

interface SmoothLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
}

export function SmoothLink({ href, onClick, children, ...props }: SmoothLinkProps) {
  const { navigate } = usePageTransition()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    
    if (onClick) {
      onClick(e)
    }
    
    navigate(href)
  }

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}
