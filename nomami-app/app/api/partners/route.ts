import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { z } from 'zod';

const partnerSchema = z.object({
  company_name: z.string().min(2, "O nome da empresa é obrigatório."),
  cnpj: z.string().min(14, "O CNPJ deve ter 14 caracteres.").max(14, "O CNPJ deve ter 14 caracteres."),
  phone: z.string().min(10, "O telefone é obrigatório."),
  address: z.string().min(5, "O endereço é obrigatório."),
  benefit_description: z.string().min(5, "A descrição do benefício é obrigatória."),
  status: z.enum(['ativo', 'inativo']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = partnerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const { company_name, cnpj, phone, address, benefit_description, status } = validation.data;

    const result = await sql`
      INSERT INTO partners (company_name, cnpj, phone, address, benefit_description, status, entry_date)
      VALUES (${company_name}, ${cnpj}, ${phone}, ${address}, ${benefit_description}, ${status}, CURRENT_DATE)
      RETURNING id;
    `;

    return NextResponse.json({ message: 'Parceiro adicionado com sucesso!', partner: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar parceiro:', error);
    return NextResponse.json({ error: 'Erro ao criar parceiro.' }, { status: 500 });
  }
}