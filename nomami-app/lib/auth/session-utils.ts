"use server"

import { cookies } from "next/headers"

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  
  // Limpar todos os cookies relacionados à autenticação
  const authCookies = [
    "next-auth.session-token",
    "next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.session-token",
    "__Host-next-auth.csrf-token",
  ]

  authCookies.forEach((cookieName) => {
    cookieStore.delete(cookieName)
  })
}

export async function validateSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("next-auth.session-token") || 
                       cookieStore.get("__Secure-next-auth.session-token")
  
  return !!sessionToken
}
