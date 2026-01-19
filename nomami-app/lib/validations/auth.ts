import { z } from 'zod';

export const userRoleSchema = z.enum(['ADMIN', 'USER']);

export const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Endereço de email inválido'),
  cpf: z.string().length(11, 'CPF deve ter exatamente 11 dígitos').regex(/^\d+$/, 'CPF deve conter apenas números'),
  role: userRoleSchema.optional().default('USER'),
});

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().uuid(),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
});

export const firstAccessValidateSchema = z.object({
  email: z.string().email('Endereço de email inválido'),
  cpf: z.string().length(11, 'CPF deve ter exatamente 11 dígitos').regex(/^\d+$/, 'CPF deve conter apenas números'),
});

export const firstAccessCompleteSchema = z.object({
  email: z.string().email('Endereço de email inválido'),
  cpf: z.string().length(11, 'CPF deve ter exatamente 11 dígitos').regex(/^\d+$/, 'CPF deve conter apenas números'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type FirstAccessValidateInput = z.infer<typeof firstAccessValidateSchema>;
export type FirstAccessCompleteInput = z.infer<typeof firstAccessCompleteSchema>;