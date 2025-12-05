import sql from '@/lib/db-pool';
import { logger, logWebhookPayload, logError } from '@/lib/logger';
import { fetchAsaas } from '@/lib/asaas';

export interface WebhookResult {
  success: boolean;
  message?: string;
  error?: string;
  status: number;
}

export interface AsaasPayment {
  customer: string;
  subscription?: string;
  dateCreated: string;
  value: number;
  [key: string]: unknown;
}

export interface AsaasWebhookEvent {
  event: string;
  dateCreated: string;
  payment: AsaasPayment;
  [key: string]: unknown;
}

async function logAsaasWebhook(requestBody: Record<string, unknown> | AsaasWebhookEvent, status: 'success' | 'failed', errorMessage?: string) {
  // Log no console via Pino
  if (status === 'failed') {
    logger.error({ errorMessage, requestBody }, 'Asaas Webhook Failed');
  } else {
    logger.info({ status }, 'Asaas Webhook Processed');
  }

  try {
    await sql`
      INSERT INTO asaas_webhook_logs (request_body, status, error_message)
      VALUES (${JSON.stringify(requestBody)}, ${status}, ${errorMessage || null})
    `;
  } catch (dbError) {
    logger.error({ err: dbError }, 'Falha ao registrar o log do webhook Asaas no banco de dados');
  }
}

export async function processAsaasWebhook(body: AsaasWebhookEvent): Promise<WebhookResult> {
  // Log do payload recebido (T009)
  logWebhookPayload('asaas', body);

  try {
    const event = body;

    // 1. Validação do Evento
    if (event.event !== 'PAYMENT_CONFIRMED') {
      return { success: true, message: 'Evento não processado.', status: 200 };
    }

    const payment = event.payment;
    if (!payment || !payment.customer) {
        await logAsaasWebhook(body, 'failed', 'ID do cliente (customer) não encontrado no evento.');
        return { success: false, error: 'ID do cliente não encontrado.', status: 400 };
    }

    // 2. Busca dados do cliente na API Asaas (Fonte da Verdade)
    const customerId = payment.customer;
    
    let customerResponse;
    try {
        customerResponse = await fetchAsaas(`/customers/${customerId}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar cliente no Asaas';
        await logAsaasWebhook(body, 'failed', errorMessage);
        return { success: false, error: 'Erro interno de configuração do servidor.', status: 500 };
    }

    if (!customerResponse.ok) {
        const errorBody = await customerResponse.text();
        const errorMessage = `Falha ao buscar cliente na API Asaas. Status: ${customerResponse.status}. Resposta: ${errorBody}`;
        await logAsaasWebhook(body, 'failed', errorMessage);
        return { success: false, error: 'Falha ao comunicar com o provedor de pagamento.', status: customerResponse.status };
    }

    const customerData = await customerResponse.json();

    // 3. Extração e Validação dos dados do cliente
    const { name, email, cpfCnpj, phone } = customerData;

    if (!name || !email || !cpfCnpj) {
        const missingFields = [];
        if (!name) missingFields.push('nome');
        if (!email) missingFields.push('email');
        if (!cpfCnpj) missingFields.push('cpfCnpj');
        
        const errorMessage = `Dados do cliente incompletos retornados pela API Asaas. Faltando: ${missingFields.join(', ')}.`;
        await logAsaasWebhook(body, 'failed', errorMessage);
        return { success: false, error: errorMessage, status: 400 };
    }

    // Calcula próxima data de vencimento (30 dias a partir do pagamento)
    const nextDueDate = new Date(event.dateCreated);
    nextDueDate.setDate(nextDueDate.getDate() + 30);

    // 4. Busca Assinante Local pelo CPF (Identificador Único Imutável)
    const existingSubscriber = await sql`
        SELECT id FROM subscribers
        WHERE cpf = ${cpfCnpj}
        LIMIT 1
    `;

    if (existingSubscriber.length > 0) {
        // 5a. Atualização (Renovação ou Reativação)
        await sql`
            UPDATE subscribers SET
                name = ${name},
                email = ${email},
                phone = ${phone || null},
                next_due_date = ${nextDueDate.toISOString()},
                status = 'active',
                value = ${payment.value},
                asaas_customer_id = ${customerId},
                asaas_subscription_id = ${payment.subscription || null}
            WHERE id = ${existingSubscriber[0].id}
        `;
        
        const successMsg = `Assinante atualizado/renovado: ${name} (CPF: ${cpfCnpj})`;
        console.log(`[ASAAS WEBHOOK] ${successMsg}`);
        await logAsaasWebhook(body, 'success', successMsg);
        return { success: true, message: 'Assinante atualizado com sucesso.', status: 200 };
    } else {
        // 5b. Criação (Novo Assinante)
        await sql`
            INSERT INTO subscribers (name, email, cpf, phone, plan_type, start_date, next_due_date, status, value, asaas_customer_id, asaas_subscription_id, created_at)
            VALUES (${name}, ${email}, ${cpfCnpj}, ${phone || null}, 'mensal', NOW(), ${nextDueDate.toISOString()}, 'active', ${payment.value}, ${customerId}, ${payment.subscription || null}, NOW())
        `;
        
        const successMsg = `Novo assinante criado: ${name} (CPF: ${cpfCnpj})`;
        console.log(`[ASAAS WEBHOOK] ${successMsg}`);
        await logAsaasWebhook(body, 'success', successMsg);
        return { success: true, message: 'Novo assinante criado com sucesso.', status: 200 };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logError(error, 'Erro ao processar webhook do Asaas');
    await logAsaasWebhook(body, 'failed', errorMessage);
    return { success: false, error: 'Erro interno do servidor.', status: 500 };
  }
}