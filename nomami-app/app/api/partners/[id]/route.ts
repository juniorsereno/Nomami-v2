import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { z } from 'zod';

const partnerSchema = z.object({
    company_name: z.string().min(2, "O nome da empresa é obrigatório."),
    cnpj: z.string().min(14, "O CNPJ deve ter 14 caracteres.").max(14, "O CNPJ deve ter 14 caracteres."),
    phone: z.string().optional(),
    address: z.string().min(5, "O endereço é obrigatório."),
    category: z.string().min(1, "A categoria é obrigatória."),
    benefit_description: z.string().min(5, "A descrição do benefício é obrigatória."),
    status: z.enum(['ativo', 'inativo']),
    logo_url: z.string().optional(),
    site_url: z.string().optional(),
    instagram_url: z.string().optional(),
});

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json();
        const validation = partnerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
        }

        const { company_name, cnpj, phone, address, category, benefit_description, status, logo_url, site_url, instagram_url } = validation.data;
        const { id } = await params;

        const result = await sql`
      UPDATE parceiros
      SET
        nome = ${company_name},
        cnpj = ${cnpj},
        categoria = ${category},
        beneficio = ${benefit_description},
        ativo = ${status === 'ativo'},
        updated_at = NOW(),
        endereco = ${address},
        telefone = ${phone || null},
        logo_url = ${logo_url || null},
        site_url = ${site_url || null},
        instagram_url = ${instagram_url || null}
      WHERE id = ${id}
      RETURNING id;
    `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Parceiro não encontrado.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Parceiro atualizado com sucesso!', partner: result[0] }, { status: 200 });
    } catch (error) {
        console.error('Erro ao atualizar parceiro:', error);
        return NextResponse.json({ error: 'Erro ao atualizar parceiro.' }, { status: 500 });
    }
}
