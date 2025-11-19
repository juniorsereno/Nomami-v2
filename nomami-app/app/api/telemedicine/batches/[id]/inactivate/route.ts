import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { getTelemedicineCredentials } from '../../../credentials/route';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1. Buscar todos os clientes do lote no nosso banco de dados
    const clients = await sql`
      SELECT * FROM telemedicine_clients WHERE batch_id = ${id};
    `;

    if (clients.length === 0) {
      return NextResponse.json({ error: 'Nenhum cliente encontrado para este lote.' }, { status: 404 });
    }

    // 2. Preparar o corpo da requisição para a API externa
    const externalApiBody = clients.map(client => ({
      'Sequencial': '',
      'Nome*': client.full_name,
      'CPF*': parseInt(client.cpf, 10),
      'Data_Nascimento*': client.birth_date,
      'Sexo*': client.gender,
      'Celular*': parseInt(client.cellphone, 10),
      'E-mail': '',
      'rg': '',
      'fone': '',
      'cep': '',
      'estado': '',
      'cidade': '',
      'bairro': '',
      'CPF_TITULAR': '',
      'relacao_dependente': '',
      'ID_PLANO*': 7,
      'ACAO*': 'I', // Ação de Inativar
      'Grupo': '',
    }));

    // 3. Enviar para a API Externa
    const { apiUser, apiPassword } = getTelemedicineCredentials();
    if (!apiUser || !apiPassword) {
      return NextResponse.json({ error: 'Credenciais da API de Telemedicina não configuradas.' }, { status: 500 });
    }

    const webhookUrl = process.env.TELEMEDICINE_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: 'URL do webhook de Telemedicina não configurada.' }, { status: 500 });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${apiUser}:${apiPassword}`),
      },
      body: JSON.stringify(externalApiBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API externa ao inativar:', errorText);
      return NextResponse.json({ error: `Erro na API externa: ${response.statusText}` }, { status: response.status });
    }

    // 4. Se a API externa respondeu com sucesso, atualiza o status no nosso banco
    await sql`
      UPDATE telemedicine_batches SET status = 'inactive' WHERE id = ${id};
    `;

    return NextResponse.json({ message: 'Lote inativado com sucesso.' });

  } catch (error) {
    console.error('Erro ao inativar lote de telemedicina:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}