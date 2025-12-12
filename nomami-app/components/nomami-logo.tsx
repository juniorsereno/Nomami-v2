import Image from "next/image"
import logoImage from "@/lib/assets/logo.webp"

interface NomamiLogoProps {
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function NomamiLogo({ 
  width = 150, 
  height = 40, 
  className = "",
  priority = false 
}: NomamiLogoProps) {
  return (
    <Image
      src={logoImage}
      alt="NoMami Logo"
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  )
}
