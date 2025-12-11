"use server"

import { signIn as nextAuthSignIn } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import sql from "../db-pool"
import { hashPassword } from "../auth/password"
import { firstAccessValidateSchema, firstAccessCompleteSchema } from "../validations/auth"

export async function signIn(prevState: { error: string } | null, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios" }
  }

  try {
    const result = await nextAuthSignIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (!result || result.error) {
      return { error: "Email ou senha inválidos" }
    }
    
    redirect("/dashboard")
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou senha inválidos" }
    }
    throw error
  }
}

export async function validateFirstAccess(data: { email: string; cpf: string }) {
  const result = firstAccessValidateSchema.safeParse(data)

  if (!result.success) {
    return { success: false, error: "Dados inválidos" }
  }

  const { email, cpf } = result.data

  try {
    const users = await sql`
      SELECT id, nome, email, cpf, password_hash
      FROM users
      WHERE email = ${email} AND cpf = ${cpf}
      LIMIT 1
    `

    if (users.length === 0) {
      return { success: false, error: "Email ou CPF inválidos" }
    }

    const user = users[0]

    // Verificar se já tem senha definida
    if (user.password_hash && user.password_hash !== '') {
      return { success: false, error: "Usuário já possui senha definida. Use a tela de login." }
    }

    return { success: true, userId: user.id }
  } catch (error) {
    console.error("Error validating first access:", error)
    return { success: false, error: "Erro ao validar dados" }
  }
}

export async function completeFirstAccess(data: { email: string; cpf: string; password: string; confirmPassword: string }) {
  const result = firstAccessCompleteSchema.safeParse(data)

  if (!result.success) {
    return { success: false, error: "Dados inválidos" }
  }

  const { email, cpf, password } = result.data

  try {
    const users = await sql`
      SELECT id, password_hash
      FROM users
      WHERE email = ${email} AND cpf = ${cpf}
      LIMIT 1
    `

    if (users.length === 0) {
      return { success: false, error: "Email ou CPF inválidos" }
    }

    const user = users[0]

    // Verificar se já tem senha definida
    if (user.password_hash && user.password_hash !== '') {
      return { success: false, error: "Usuário já possui senha definida" }
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password)

    // Atualizar senha
    await sql`
      UPDATE users
      SET password_hash = ${hashedPassword}, updated_at = NOW()
      WHERE id = ${user.id}
    `

    return { success: true }
  } catch (error) {
    console.error("Error completing first access:", error)
    return { success: false, error: "Erro ao definir senha" }
  }
}
