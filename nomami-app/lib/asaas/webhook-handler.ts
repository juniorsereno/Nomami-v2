import sql from '@/lib/db-pool';
import { logger, logWebhookPayload, logError } from '@/lib/logger';
import { fetchAsaas } from '@/lib/asaas';
import { executeCadence, SubscriberInfo } from '@/lib/whatsapp/cadence-service';
import { getWhatsAppConfig } from '@/lib/whatsapp/config';

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
  dueDate?: string;
  value: number;
  status?: string;
  [key: string]: unknown;
}

export interface AsaasWebhookEvent {
  event: string;
  dateCreated: string;
  payment: AsaasPayment;
  [key: string]: unknown;
}

async function logAsaasWebhook(
  requestBody: Record<string, unknown> | AsaasWebhookEvent, 
  status: 'success' | 'failed', 
  errorMessage?: string,
  asaasApiResponse?: Record<string, unknown>
) {
  // Log no console via Pino
  if (status === 'failed') {
    logger.error({ errorMessage, requestBody }, 'Asaas Webhook Failed');
  } else {
    logger.info({ status }, 'Asaas Webhook Processed');
  }

  try {
    await sql`
      INSERT INTO asaas_webhook_logs (request_body, status, error_message, asaas_api_response)
      VALUES (
        ${JSON.stringify(requestBody)}, 
        ${status}, 
        ${errorMessage || null},
        ${asaasApiResponse ? JSON.stringify(asaasApiResponse) : null}
      )
    `;
  } catch (dbError) {
    logger.error({ err: dbError }, 'Falha ao registrar o log do webhook Asaas no banco de dados');
  }
}

async function processPaymentOverdue(
  body: AsaasWebhookEvent,
  payment: AsaasPayment
): Promise<WebhookResult> {
  const customerId = payment.customer;
  
  logger.info({
    service: 'asaas',
    event: 'PAYMENT_OVERDUE',
    customerId,
    dueDate: payment.dueDate
  }, `
╭──────────────────────────────────────────────────
│ ⚠️ ASAAS PAYMENT OVERDUE
│
│ 👤 Customer ID: ${customerId}
│ 📅 Data Vencimento: ${payment.dueDate}
│ 💰 Valor: R$ ${payment.value}
╰──────────────────────────────────────────────────`);

  try {
    // 1. Busca dados do cliente na API Asaas
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
    const asaasApiResponse = customerData;
    const { cpfCnpj, name: customerName } = customerData;

    if (!cpfCnpj) {
      const errorMessage = 'CPF/CNPJ não encontrado nos dados do cliente';
      await logAsaasWebhook(body, 'failed', errorMessage, asaasApiResponse);
      return { success: false, error: errorMessage, status: 400 };
    }

    logger.info({
      service: 'asaas',
      customerId,
      cpfCnpj,
      customerName
    }, `
╭──────────────────────────────────────────────────
│ 🔍 ASAAS CUSTOMER FOUND
│
│ 👤 Nome: ${customerName}
│ 📄 CPF/CNPJ: ${cpfCnpj}
│ 🔑 Customer ID: ${customerId}
╰──────────────────────────────────────────────────`);

    // 2. Busca assinante pelo CPF
    const existingSubscriber = await sql`
      SELECT id, name FROM subscribers
      WHERE cpf = ${cpfCnpj}
      LIMIT 1
    `;

    if (existingSubscriber.length === 0) {
      const errorMessage = `Assinante não encontrado com CPF: ${cpfCnpj}`;
      await logAsaasWebhook(body, 'failed', errorMessage, asaasApiResponse);
      return { success: false, error: errorMessage, status: 404 };
    }

    // 3. Atualiza status para vencido e next_due_date
    const dueDate = payment.dueDate ? new Date(payment.dueDate) : new Date();
    
    await sql`
      UPDATE subscribers SET
        status = 'vencido',
        next_due_date = ${dueDate.toISOString()}
      WHERE id = ${existingSubscriber[0].id}
    `;

    const successMsg = `Assinante marcado como vencido: ${existingSubscriber[0].name} (CPF: ${cpfCnpj}). Data de vencimento: ${payment.dueDate}`;
    
    logger.info({
      service: 'asaas',
      customerId,
      cpfCnpj,
      subscriberName: existingSubscriber[0].name
    }, `
╭──────────────────────────────────────────────────
│ ✅ ASAAS SUBSCRIBER MARKED OVERDUE
│
│ 👤 Nome: ${existingSubscriber[0].name}
│ 📄 CPF: ${cpfCnpj}
│ 📅 Data Vencimento: ${payment.dueDate}
│ 📋 Status: ativo → vencido
╰──────────────────────────────────────────────────`);

    await logAsaasWebhook(body, 'success', successMsg, asaasApiResponse);
    
    return { 
      success: true, 
      message: 'Assinante marcado como vencido com sucesso.', 
      status: 200 
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar pagamento vencido';
    logError(error, 'Erro ao processar PAYMENT_OVERDUE');
    await logAsaasWebhook(body, 'failed', errorMessage);
    return { success: false, error: 'Erro interno do servidor.', status: 500 };
  }
}

export async function processAsaasWebhook(body: AsaasWebhookEvent): Promise<WebhookResult> {
  // Log do payload recebido (T009)
  logWebhookPayload('asaas', body);

  try {
    const event = body;

    // 1. Validação do Evento
    const eventType = event.event;
    
    // Eventos suportados
    if (eventType !== 'PAYMENT_CONFIRMED' && eventType !== 'PAYMENT_RECEIVED' && eventType !== 'PAYMENT_OVERDUE') {
      return { success: true, message: 'Evento não processado.', status: 200 };
    }

    const payment = event.payment;
    if (!payment || !payment.customer) {
        await logAsaasWebhook(body, 'failed', 'ID do cliente (customer) não encontrado no evento.');
        return { success: false, error: 'ID do cliente não encontrado.', status: 400 };
    }

    // 1.1 Processar PAYMENT_OVERDUE (Pagamento Vencido)
    if (eventType === 'PAYMENT_OVERDUE') {
      return await processPaymentOverdue(body, payment);
    }

    // PAYMENT_CONFIRMED e PAYMENT_RECEIVED são tratados da mesma forma
    logger.info({
      service: 'asaas',
      event: eventType,
      customerId: payment.customer
    }, `
╭──────────────────────────────────────────────────
│ 💳 ASAAS ${eventType}
│
│ 👤 Customer ID: ${payment.customer}
│ 💰 Valor: R$ ${payment.value}
╰──────────────────────────────────────────────────`);

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
    
    // Armazena a resposta da API para logging
    const asaasApiResponse = customerData;

    // 3. Extração e Validação dos dados do cliente
    const { name, email, cpfCnpj, phone } = customerData;

    if (!name || !email || !cpfCnpj) {
        const missingFields = [];
        if (!name) missingFields.push('nome');
        if (!email) missingFields.push('email');
        if (!cpfCnpj) missingFields.push('cpfCnpj');
        
        const errorMessage = `Dados do cliente incompletos retornados pela API Asaas. Faltando: ${missingFields.join(', ')}.`;
        await logAsaasWebhook(body, 'failed', errorMessage, asaasApiResponse);
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
                status = 'ativo',
                value = ${payment.value},
                asaas_customer_id = ${customerId},
                asaas_subscription_id = ${payment.subscription || null}
            WHERE id = ${existingSubscriber[0].id}
        `;
        
        const successMsg = `Assinante atualizado/renovado: ${name} (CPF: ${cpfCnpj})`;
        console.log(`[ASAAS WEBHOOK] ${successMsg}`);
        await logAsaasWebhook(body, 'success', successMsg, asaasApiResponse);
        return { success: true, message: 'Assinante atualizado com sucesso.', status: 200 };
    } else {
        // 5b. Criação (Novo Assinante)
        // Generate unique card_id (8 character hex string)
        const cardId = Math.random().toString(16).substring(2, 10).toUpperCase();
        
        const newSubscriberResult = await sql`
            INSERT INTO subscribers (name, email, cpf, phone, plan_type, start_date, next_due_date, status, value, asaas_customer_id, asaas_subscription_id, card_id, created_at)
            VALUES (${name}, ${email}, ${cpfCnpj}, ${phone || null}, 'mensal', NOW(), ${nextDueDate.toISOString()}, 'ativo', ${payment.value}, ${customerId}, ${payment.subscription || null}, ${cardId}, NOW())
            RETURNING id
        `;
        
        const successMsg = `Novo assinante criado: ${name} (CPF: ${cpfCnpj})`;
        console.log(`[ASAAS WEBHOOK] ${successMsg}`);
        await logAsaasWebhook(body, 'success', successMsg, asaasApiResponse);

        // Execute WhatsApp cadence for new subscriber (if enabled)
        try {
          const whatsappConfig = await getWhatsAppConfig();
          
          if (whatsappConfig.cadenceEnabled && phone) {
            logger.info({
              subscriberId: newSubscriberResult[0].id,
              subscriberName: name,
              phone
            }, 'Starting WhatsApp cadence for new subscriber');

            const subscriberInfo: SubscriberInfo = {
              id: newSubscriberResult[0].id,
              name,
              phone,
              subscriptionDate: new Date().toISOString(),
            };

            // Execute cadence asynchronously (don't block webhook response)
            executeCadence(subscriberInfo).then(result => {
              if (result.success) {
                logger.info({
                  subscriberId: newSubscriberResult[0].id,
                  messagesSucceeded: result.messagesSucceeded
                }, 'WhatsApp cadence completed successfully');
              } else {
                logger.warn({
                  subscriberId: newSubscriberResult[0].id,
                  messagesFailed: result.messagesFailed,
                  errors: result.errors
                }, 'WhatsApp cadence completed with failures');
              }
            }).catch(error => {
              logError(error, 'Error executing WhatsApp cadence');
            });
          } else if (!whatsappConfig.cadenceEnabled) {
            logger.info({
              subscriberId: newSubscriberResult[0].id
            }, 'WhatsApp cadence is disabled, skipping');
          } else if (!phone) {
            logger.info({
              subscriberId: newSubscriberResult[0].id
            }, 'Subscriber has no phone number, skipping WhatsApp cadence');
          }
        } catch (cadenceError) {
          // Don't fail the webhook if cadence fails
          logError(cadenceError, 'Error initiating WhatsApp cadence');
        }

        return { success: true, message: 'Novo assinante criado com sucesso.', status: 200 };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logError(error, 'Erro ao processar webhook do Asaas');
    await logAsaasWebhook(body, 'failed', errorMessage);
    return { success: false, error: 'Erro interno do servidor.', status: 500 };
  }
}