import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';

export async function GET() {
  try {
    const partners = await sql`
      SELECT
        p.nome as company_name,
        p.cnpj,
        pc.valor as phone,
        p.ativo,
        p.created_at,
        p.beneficio as benefit_description,
        CONCAT(pe.rua, ', ', pe.numero, ' - ', pe.bairro, ', ', pe.cidade, ' - ', pe.estado) as address
      FROM
        parceiros p
      LEFT JOIN
        parceiro_contatos pc ON p.id = pc.parceiro_id AND pc.tipo = 'telefone' AND pc.is_principal = true
      LEFT JOIN
        parceiro_enderecos pe ON p.id = pe.parceiro_id AND pe.is_principal = true
      ORDER BY
        p.nome ASC
    `;

    return NextResponse.json(partners);
  } catch (error) {
    console.error('Erro na API de listagem de parceiros:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados.' }, { status: 500 });
  }
}