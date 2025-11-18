import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { getTelemedicineCredentials } from '../credentials/route';

export async function POST(request: Request) {
  const externalApiBody = await request.json();

  // 1. Validação do Corpo da Requisição
  if (!Array.isArray(externalApiBody) || externalApiBody.length === 0) {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  try {
    // 2. Salvar no Banco de Dados
    // Usar o nome do primeiro cliente como identificador do lote, se disponível
    const firstClientName = externalApiBody[0]?.['Nome*'] || 'Lote';
    const batchIdentifier = `${firstClientName} - ${new Date().toLocaleString('pt-BR')}`;

    // A biblioteca @neondatabase/serverless não usa sql.begin.
    // A transação é tratada de forma diferente. Vamos inserir o lote primeiro e depois os clientes.
    // O ideal seria uma transação completa, mas vamos garantir a consistência na aplicação.

    // 1. Cria o lote
    const batch = await sql`
      INSERT INTO telemedicine_batches (batch_identifier, status)
      VALUES (${batchIdentifier}, 'active')
      RETURNING id;
    `;
    const batchId = batch[0].id;

    // 2. Insere cada cliente, vinculando ao lote
    for (const client of externalApiBody) {
      await sql`
        INSERT INTO telemedicine_clients (batch_id, full_name, cpf, birth_date, gender, cellphone)
        VALUES (
          ${batchId},
          ${client['Nome*']},
          ${client['CPF*'].toString()},
          ${client['Data_Nascimento*']},
          ${client['Sexo*']},
          ${client['Celular*'].toString()}
        );
      `;
    }

    // 3. Enviar para a API Externa (somente após sucesso no DB)
    const { apiUser, apiPassword } = getTelemedicineCredentials();
    if (!apiUser || !apiPassword) {
      // Mesmo com erro de credencial, o lote já foi salvo. O status poderia ser atualizado para 'pending_sync' aqui.
      return NextResponse.json({ error: 'Credenciais da API de Telemedicina não configuradas. O lote foi salvo localmente.' }, { status: 500 });
    }

    const response = await fetch('https://webh.criativamaisdigital.com.br/webhook/661ea9ca-69d4-4876-ae67-59b2f9b59f18', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${apiUser}:${apiPassword}`),
      },
      body: JSON.stringify(externalApiBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API externa:', errorText);
      // O lote foi salvo, mas a sincronização falhou. Poderíamos atualizar o status do lote aqui.
      return NextResponse.json({
        message: 'Lote salvo no banco de dados, mas falhou ao enviar para a API externa.',
        error: `Erro na API externa: ${response.statusText}`
      }, { status: 502 });
    }

    const responseData = await response.json();
    return NextResponse.json({
      message: 'Lote processado e salvo com sucesso.',
      externalApiResponse: responseData
    });

  } catch (error) {
    console.error('Erro ao processar o lote de telemedicina:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Erro interno do servidor.', details: errorMessage }, { status: 500 });
  }
}