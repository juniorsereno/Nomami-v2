"use server"

import { auth } from "@/lib/auth"
import sql from "../db-pool"
import { hashPassword, comparePassword } from "../auth/password"
import { revalidatePath } from "next/cache"

export async function updateProfile(data: { name: string; email: string }) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" }
  }

  const { name, email } = data

  if (!name || !email) {
    return { success: false, error: "Nome e email são obrigatórios" }
  }

  try {
    // Verificar se o email já está em uso por outro usuário
    const existing = await sql`
      SELECT id FROM users 
      WHERE email = ${email} AND id != ${session.user.id}
      LIMIT 1
    `

    if (existing.length > 0) {
      return { success: false, error: "Este email já está em uso" }
    }

    // Atualizar perfil
    await sql`
      UPDATE users
      SET nome = ${name}, email = ${email}, updated_at = NOW()
      WHERE id = ${session.user.id}
    `

    revalidatePath("/account")
    return { success: true }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { success: false, error: "Erro ao atualizar perfil" }
  }
}

export async function updatePassword(data: { currentPassword: string; newPassword: string }) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" }
  }

  const { currentPassword, newPassword } = data

  if (!currentPassword || !newPassword) {
    return { success: false, error: "Senhas são obrigatórias" }
  }

  if (newPassword.length < 8) {
    return { success: false, error: "Nova senha deve ter pelo menos 8 caracteres" }
  }

  try {
    // Buscar senha atual
    const users = await sql`
      SELECT password_hash FROM users
      WHERE id = ${session.user.id}
      LIMIT 1
    `

    if (users.length === 0) {
      return { success: false, error: "Usuário não encontrado" }
    }

    const user = users[0]

    // Verificar senha atual
    const isValid = await comparePassword(currentPassword, user.password_hash)

    if (!isValid) {
      return { success: false, error: "Senha atual incorreta" }
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(newPassword)

    // Atualizar senha
    await sql`
      UPDATE users
      SET password_hash = ${hashedPassword}, updated_at = NOW()
      WHERE id = ${session.user.id}
    `

    return { success: true }
  } catch (error) {
    console.error("Error updating password:", error)
    return { success: false, error: "Erro ao atualizar senha" }
  }
}

export async function getCurrentUser() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" }
  }

  try {
    const users = await sql`
      SELECT id, nome as name, email, role, created_at
      FROM users
      WHERE id = ${session.user.id}
      LIMIT 1
    `

    if (users.length === 0) {
      return { success: false, error: "Usuário não encontrado" }
    }

    return { success: true, data: users[0] }
  } catch (error) {
    console.error("Error fetching user:", error)
    return { success: false, error: "Erro ao buscar usuário" }
  }
}
