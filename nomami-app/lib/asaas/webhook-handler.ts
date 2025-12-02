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

    // 2. Verificação de Renovação (Regra dos 7 dias)
    const paymentDateCreated = new Date(payment.dateCreated);
    const eventDateCreated = new Date(event.dateCreated);
    
    // Diferença em milissegundos
    const diffTime = Math.abs(eventDateCreated.getTime() - paymentDateCreated.getTime());
    // Diferença em dias
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isRenewal = diffDays > 7;

    if (isRenewal) {
        // Lógica de Renovação
        const customerId = payment.customer;
        
        // Buscar assinante pelo asaas_customer_id
        const existingSubscriber = await sql`
            SELECT id FROM subscribers
            WHERE asaas_customer_id = ${customerId}
            LIMIT 1
        `;

        if (existingSubscriber.length > 0) {
            const nextDueDate = new Date(event.dateCreated);
            nextDueDate.setDate(nextDueDate.getDate() + 30);

            await sql`
                UPDATE subscribers SET
                    next_due_date = ${nextDueDate.toISOString()},
                    status = 'active',
                    value = ${payment.value}
                WHERE id = ${existingSubscriber[0].id}
            `;
            
            await logAsaasWebhook(body, 'success', `Renovação processada. Diferença de dias: ${diffDays}.`);
            return { success: true, message: 'Renovação processada com sucesso.', status: 200 };
        } else {
            // Se não encontrar pelo ID do Asaas, busca os dados do cliente na API
            // para criar um novo registro mantendo a data de criação original (histórico)
            console.warn(`Renovação detectada mas assinante não encontrado pelo asaas_customer_id: ${customerId}. Criando novo registro com histórico.`);

            let customerResponse;
            try {
                customerResponse = await fetchAsaas(`/customers/${customerId}`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar cliente no Asaas (Renovação Órfã)';
                await logAsaasWebhook(body, 'failed', errorMessage);
                return { success: false, error: 'Erro interno ao buscar cliente.', status: 500 };
            }

            if (!customerResponse.ok) {
                const errorBody = await customerResponse.text();
                const errorMessage = `Falha ao buscar cliente na API Asaas (Renovação Órfã). Status: ${customerResponse.status}. Resposta: ${errorBody}`;
                await logAsaasWebhook(body, 'failed', errorMessage);
                return { success: false, error: 'Falha ao comunicar com o provedor de pagamento.', status: customerResponse.status };
            }

            const customerData = await customerResponse.json();
            const { name, email, cpfCnpj, phone, dateCreated: customerDateCreated } = customerData;

            if (!name || !email || !cpfCnpj) {
                const errorMessage = `Dados do cliente incompletos na API Asaas (Renovação Órfã).`;
                await logAsaasWebhook(body, 'failed', errorMessage);
                return { success: false, error: errorMessage, status: 400 };
            }

            const nextDueDate = new Date(event.dateCreated);
            nextDueDate.setDate(nextDueDate.getDate() + 30);

            // Usa a data de criação do cliente no Asaas como start_date para manter histórico
            const startDate = customerDateCreated ? new Date(customerDateCreated) : new Date();

            await sql`
                INSERT INTO subscribers (name, email, cpf, phone, plan_type, start_date, next_due_date, status, value, asaas_customer_id, created_at)
                VALUES (${name}, ${email}, ${cpfCnpj}, ${phone || null}, 'mensal', ${startDate.toISOString()}, ${nextDueDate.toISOString()}, 'active', ${payment.value}, ${customerId}, NOW())
            `;

            await logAsaasWebhook(body, 'success', `Renovação processada para novo assinante local (recuperado do Asaas). Data Início: ${startDate.toISOString()}.`);
            return { success: true, message: 'Renovação processada e assinante recriado com sucesso.', status: 200 };
        }
    }

    // 3. Fluxo Normal (Novo Pagamento ou Renovação não detectada pelo ID)
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

    // 4. Extração dos dados do cliente
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

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 30);

    // 5. Cadastro ou Atualização do Assinante
    const existingSubscriber = await sql`
        SELECT id FROM subscribers
        WHERE cpf = ${cpfCnpj} OR email = ${email}
        LIMIT 1
    `;

    if (existingSubscriber.length > 0) {
        // Atualizar
        await sql`
            UPDATE subscribers SET
                name = ${name},
                email = ${email},
                phone = ${phone || null},
                next_due_date = ${nextDueDate.toISOString()},
                status = 'active',
                value = ${payment.value},
                asaas_customer_id = ${customerId}
            WHERE id = ${existingSubscriber[0].id}
        `;
    } else {
        // Inserir
        await sql`
            INSERT INTO subscribers (name, email, cpf, phone, plan_type, start_date, next_due_date, status, value, asaas_customer_id, created_at)
            VALUES (${name}, ${email}, ${cpfCnpj}, ${phone || null}, 'mensal', NOW(), ${nextDueDate.toISOString()}, 'active', ${payment.value}, ${customerId}, NOW())
        `;
    }

    await logAsaasWebhook(body, 'success');
    return { success: true, message: 'Webhook Asaas processado com sucesso.', status: 200 };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logError(error, 'Erro ao processar webhook do Asaas');
    await logAsaasWebhook(body, 'failed', errorMessage);
    return { success: false, error: 'Erro interno do servidor.', status: 500 };
  }
}