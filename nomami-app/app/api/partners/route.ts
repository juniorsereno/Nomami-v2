import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { z } from 'zod';
import { logger, logError } from '@/lib/logger';

const partnerSchema = z.object({
  company_name: z.string().min(2, "O nome da empresa é obrigatório."),
  cnpj: z.string()
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 14, "O CNPJ deve ter 14 dígitos."),
  phone: z.string().optional(),
  address: z.string().min(5, "O endereço é obrigatório."),
  category: z.string().min(1, "A categoria é obrigatória."),
  benefit_description: z.string().min(5, "A descrição do benefício é obrigatória."),
  status: z.enum(['ativo', 'inativo']),
  logo_url: z.string().optional(),
  site_url: z.string().optional(),
  instagram_url: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = partnerSchema.safeParse(body);

    if (!validation.success) {
      logger.warn({ errors: validation.error.flatten() }, 'Tentativa de criação de parceiro com dados inválidos');
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const { company_name, cnpj, phone, address, category, benefit_description, status, logo_url, site_url, instagram_url } = validation.data;

    logger.info({ company_name, cnpj }, 'Criando novo parceiro');

    const result = await sql`
      INSERT INTO parceiros (nome, cnpj, categoria, beneficio, ativo, updated_at, endereco, telefone, logo_url, site_url, instagram_url)
      VALUES (${company_name}, ${cnpj}, ${category}, ${benefit_description}, ${status === 'ativo'}, NOW(), ${address}, ${phone || null}, ${logo_url || null}, ${site_url || null}, ${instagram_url || null})
      RETURNING id;
    `;

    logger.info({ partnerId: result[0].id }, 'Parceiro criado com sucesso');

    return NextResponse.json({ message: 'Parceiro adicionado com sucesso!', partner: result[0] }, { status: 201 });
  } catch (error) {
    logError(error, 'Erro ao criar parceiro');
    return NextResponse.json({ error: 'Erro ao criar parceiro.' }, { status: 500 });
  }
}