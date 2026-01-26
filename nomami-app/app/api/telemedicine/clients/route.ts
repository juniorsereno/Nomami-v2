import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { getTelemedicineCredentials } from '@/lib/telemedicine-config';
import { logger, logError } from '@/lib/logger';

export async function POST(request: Request) {
  const externalApiBody = await request.json();

  logger.info({ clientCount: Array.isArray(externalApiBody) ? externalApiBody.length : 0 }, 'Processing Telemedicine Batch');

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
      VALUES (${batchIdentifier}, 'ativo')
      RETURNING id;
    `;
    const batchId = batch[0].id;

    // 2. Insere cada cliente, vinculando ao lote
    for (const client of externalApiBody) {
      // Garante que CPF e Celular sejam strings com zeros à esquerda preservados
      const cpf = typeof client['CPF*'] === 'string' ? client['CPF*'] : String(client['CPF*']).padStart(11, '0');
      const cellphone = typeof client['Celular*'] === 'string' ? client['Celular*'] : String(client['Celular*']).padStart(11, '0');
      
      await sql`
        INSERT INTO telemedicine_clients (batch_id, full_name, cpf, birth_date, gender, cellphone)
        VALUES (
          ${batchId},
          ${client['Nome*']},
          ${cpf},
          ${client['Data_Nascimento*']},
          ${client['Sexo*']},
          ${cellphone}
        );
      `;
    }

    // 3. Enviar para a API Externa (somente após sucesso no DB)
    const { apiUser, apiPassword } = getTelemedicineCredentials();
    if (!apiUser || !apiPassword) {
      // Mesmo com erro de credencial, o lote já foi salvo. O status poderia ser atualizado para 'pending_sync' aqui.
      return NextResponse.json({ error: 'Credenciais da API de Telemedicina não configuradas. O lote foi salvo localmente.' }, { status: 500 });
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

    const responseStatus = response.status;
    let responseData = null;
    let errorMessage = null;

    if (!response.ok) {
      const errorText = await response.text();
      errorMessage = `${response.statusText}: ${errorText}`;
      logger.error({ errorText, status: response.status }, 'Erro da API externa de Telemedicina');
      
      // Salva log de erro
      await sql`
        INSERT INTO telemedicine_api_logs (batch_id, request_body, response_status, error_message)
        VALUES (${batchId}, ${JSON.stringify(externalApiBody)}, ${responseStatus}, ${errorMessage});
      `;
      
      return NextResponse.json({
        message: 'Lote salvo no banco de dados, mas falhou ao enviar para a API externa.',
        error: errorMessage
      }, { status: 502 });
    }

    responseData = await response.json();
    
    // Salva log de sucesso
    await sql`
      INSERT INTO telemedicine_api_logs (batch_id, request_body, response_status, response_body)
      VALUES (${batchId}, ${JSON.stringify(externalApiBody)}, ${responseStatus}, ${JSON.stringify(responseData)});
    `;
    
    logger.info({ batchId, responseStatus }, 'Lote enviado com sucesso para API de Telemedicina');
    
    return NextResponse.json({
      message: 'Lote processado e salvo com sucesso.',
      externalApiResponse: responseData
    });

  } catch (error) {
    logError(error, 'Erro ao processar o lote de telemedicina');
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Erro interno do servidor.', details: errorMessage }, { status: 500 });
  }
}