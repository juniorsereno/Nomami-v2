import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { getTelemedicineCredentials } from '@/lib/telemedicine-config';
import { logger, logError } from '@/lib/logger';

/**
 * Reenvia lotes ativos para a API de telemedicina
 * POST /api/telemedicine/batches/resend
 * Body: { batchIds?: number[] } - Se não informado, reenvia todos os lotes ativos
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { batchIds } = body;

    logger.info({ batchIds }, 'Iniciando reenvio de lotes de telemedicina');

    // 1. Buscar lotes ativos
    let batches;
    if (batchIds && Array.isArray(batchIds) && batchIds.length > 0) {
      batches = await sql`
        SELECT id, batch_identifier, status
        FROM telemedicine_batches
        WHERE id = ANY(${batchIds}) AND status = 'ativo'
        ORDER BY id;
      `;
    } else {
      batches = await sql`
        SELECT id, batch_identifier, status
        FROM telemedicine_batches
        WHERE status = 'ativo'
        ORDER BY id;
      `;
    }

    if (batches.length === 0) {
      return NextResponse.json({ 
        message: 'Nenhum lote ativo encontrado para reenviar.',
        processed: 0,
        success: 0,
        failed: 0
      });
    }

    logger.info({ batchCount: batches.length }, `Encontrados ${batches.length} lote(s) para reenviar`);

    // 2. Verificar credenciais
    const { apiUser, apiPassword } = getTelemedicineCredentials();
    if (!apiUser || !apiPassword) {
      return NextResponse.json({ 
        error: 'Credenciais da API de Telemedicina não configuradas.' 
      }, { status: 500 });
    }

    const webhookUrl = process.env.TELEMEDICINE_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ 
        error: 'URL do webhook de Telemedicina não configurada.' 
      }, { status: 500 });
    }

    // 3. Processar cada lote
    const results = {
      processed: 0,
      success: 0,
      failed: 0,
      details: [] as Array<{
        batchId: number;
        batchIdentifier: string;
        status: 'success' | 'failed';
        error?: string;
      }>
    };

    for (const batch of batches) {
      results.processed++;
      
      try {
        // Buscar clientes do lote
        const clients = await sql`
          SELECT full_name, cpf, birth_date, gender, cellphone
          FROM telemedicine_clients
          WHERE batch_id = ${batch.id}
          ORDER BY id;
        `;

        if (clients.length === 0) {
          logger.warn({ batchId: batch.id }, 'Lote sem clientes, pulando');
          results.details.push({
            batchId: batch.id,
            batchIdentifier: batch.batch_identifier,
            status: 'failed',
            error: 'Lote sem clientes'
          });
          results.failed++;
          continue;
        }

        // Montar payload no formato esperado pela API
        const apiBody = clients.map(client => ({
          'Sequencial': '',
          'Nome*': client.full_name,
          'CPF*': client.cpf, // Já está corrigido no banco
          'Data_Nascimento*': client.birth_date,
          'Sexo*': client.gender,
          'Celular*': client.cellphone, // Já está corrigido no banco
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
          'ACAO*': 'A',
          'Grupo': '',
        }));

        logger.info({ 
          batchId: batch.id, 
          clientCount: clients.length 
        }, `Reenviando lote ${batch.id} com ${clients.length} cliente(s)`);

        // Enviar para a API
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(`${apiUser}:${apiPassword}`),
          },
          body: JSON.stringify(apiBody),
        });

        const responseStatus = response.status;
        let responseData = null;
        let errorMessage = null;

        if (!response.ok) {
          const errorText = await response.text();
          errorMessage = `${response.statusText}: ${errorText}`;
          logger.error({ 
            batchId: batch.id, 
            errorText, 
            status: response.status 
          }, 'Erro ao reenviar lote');
          
          // Salva log de erro
          await sql`
            INSERT INTO telemedicine_api_logs (batch_id, request_body, response_status, error_message)
            VALUES (${batch.id}, ${JSON.stringify(apiBody)}, ${responseStatus}, ${errorMessage});
          `;
          
          results.details.push({
            batchId: batch.id,
            batchIdentifier: batch.batch_identifier,
            status: 'failed',
            error: errorMessage
          });
          results.failed++;
        } else {
          responseData = await response.json();
          
          // Salva log de sucesso
          await sql`
            INSERT INTO telemedicine_api_logs (batch_id, request_body, response_status, response_body)
            VALUES (${batch.id}, ${JSON.stringify(apiBody)}, ${responseStatus}, ${JSON.stringify(responseData)});
          `;
          
          logger.info({ 
            batchId: batch.id, 
            responseStatus 
          }, 'Lote reenviado com sucesso');
          
          results.details.push({
            batchId: batch.id,
            batchIdentifier: batch.batch_identifier,
            status: 'success'
          });
          results.success++;
        }

        // Pequeno delay entre requisições para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        logError(error, `Erro ao processar lote ${batch.id}`);
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        
        results.details.push({
          batchId: batch.id,
          batchIdentifier: batch.batch_identifier,
          status: 'failed',
          error: errorMsg
        });
        results.failed++;
      }
    }

    logger.info(results, 'Reenvio de lotes concluído');

    return NextResponse.json({
      message: `Reenvio concluído: ${results.success} sucesso, ${results.failed} falhas`,
      ...results
    });

  } catch (error) {
    logError(error, 'Erro ao reenviar lotes de telemedicina');
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ 
      error: 'Erro interno do servidor.', 
      details: errorMessage 
    }, { status: 500 });
  }
}
