'use server';

import { revalidatePath } from 'next/cache';
import sql from '../db-pool';
import { CreateUserInput, UpdateUserInput, createUserSchema, updateUserSchema } from '../validations/auth';
import { hashPassword } from '../auth/password';

export async function getUsers() {
  try {
    const users = await sql`
      SELECT id, nome as name, email, cpf, role, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;
    return { success: true, data: users };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Falha ao buscar usuários' };
  }
}

export async function createUser(data: CreateUserInput) {
  const result = createUserSchema.safeParse(data);

  if (!result.success) {
    return { success: false, error: 'Dados inválidos', validationErrors: result.error.flatten() };
  }

  const { name, email, cpf, role } = result.data;

  try {
    // Check for duplicates
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email} OR cpf = ${cpf} LIMIT 1
    `;

    if (existing.length > 0) {
      return { success: false, error: 'Usuário com este Email ou CPF já existe' };
    }

    // Insert user (password_hash will be set during first access)
    await sql`
      INSERT INTO users (nome, email, cpf, role, password_hash, updated_at)
      VALUES (${name}, ${email}, ${cpf}, ${role}, '', NOW())
    `;

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Falha ao criar usuário' };
  }
}

export async function updateUser(data: UpdateUserInput) {
  const result = updateUserSchema.safeParse(data);

  if (!result.success) {
    return { success: false, error: 'Dados inválidos', validationErrors: result.error.flatten() };
  }

  const { id, name, email, cpf, role, password } = result.data;

  try {
     // Check for duplicates excluding self
     if (email || cpf) {
        const existing = await sql`
          SELECT id FROM users 
          WHERE (email = ${email || ''} OR cpf = ${cpf || ''}) 
          AND id != ${id} 
          LIMIT 1
        `;

        if (existing.length > 0) {
          return { success: false, error: 'Outro usuário com este Email ou CPF já existe' };
        }
     }

    // Dynamic update query construction is tricky with raw SQL tag.
    // For simplicity/safety, we'll update fields if they are provided.
    // A more robust ORM/QueryBuilder is recommended for complex dynamic updates.
    
    // Simple approach: Update all provided fields. 
    // Since this is admin-controlled, we trust the input structure mostly.
    
    let hashedPassword = null;
    if (password) {
        hashedPassword = await hashPassword(password);
    }

    if (hashedPassword) {
         await sql`
            UPDATE users 
            SET nome = COALESCE(${name}, nome), 
                email = COALESCE(${email}, email), 
                cpf = COALESCE(${cpf}, cpf), 
                role = COALESCE(${role}, role),
                password_hash = ${hashedPassword},
                updated_at = NOW()
            WHERE id = ${id}
        `;
    } else {
         await sql`
            UPDATE users 
            SET nome = COALESCE(${name}, nome), 
                email = COALESCE(${email}, email), 
                cpf = COALESCE(${cpf}, cpf), 
                role = COALESCE(${role}, role),
                updated_at = NOW()
            WHERE id = ${id}
        `;
    }

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Falha ao atualizar usuário' };
  }
}

export async function deleteUser(id: string) {
    // Edge case: Self-lockout prevention should ideally be handled here or in UI
    // But since we don't have current user context easily available in raw server action 
    // without passing it in or using auth(), we rely on UI or session check.
    // TODO: Add robust self-delete check if critical.

  try {
    await sql`DELETE FROM users WHERE id = ${id}`;
    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Falha ao excluir usuário' };
  }
}