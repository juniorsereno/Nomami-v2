import sql from '@/lib/db-pool';
import { logger, logWebhookPayload, logError } from '@/lib/logger';
import { executeCadence, SubscriberInfo } from '@/lib/whatsapp/cadence-service';
import { getWhatsAppConfig } from '@/lib/whatsapp/config';

export interface WebhookResult {
  success: boolean;
  message?: string;
  error?: string;
  status: number;
}

export interface StripeInvoice {
  id: string;
  customer: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  amount_paid: number;
  status: string;
  billing_reason?: string;
  parent?: {
    subscription_details?: {
      subscription: string;
    };
  };
  [key: string]: unknown;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  created: number;
  data: {
    object: StripeInvoice;
  };
  [key: string]: unknown;
}

async function logStripeWebhook(
  requestBody: Record<string, unknown> | StripeWebhookEvent,
  status: 'success' | 'failed',
  errorMessage?: string
) {
  if (status === 'failed') {
    logger.error({ errorMessage, requestBody }, 'Stripe Webhook Failed');
  } else {
    logger.info({ status }, 'Stripe Webhook Processed');
  }

  try {
    await sql`
      INSERT INTO stripe_webhook_logs (request_body, status, error_message)
      VALUES (${JSON.stringify(requestBody)}, ${status}, ${errorMessage || null})
    `;
  } catch (dbError) {
    logger.error({ err: dbError }, 'Falha ao registrar o log do webhook Stripe no banco de dados');
  }
}

async function processPaymentFailed(
  body: StripeWebhookEvent,
  invoice: StripeInvoice
): Promise<WebhookResult> {
  const customerId = invoice.customer;
  const customerEmail = invoice.customer_email;

  logger.info({
    service: 'stripe',
    event: 'PAYMENT_FAILED',
    customerId,
    customerEmail
  }, `
╭──────────────────────────────────────────────────
│ ⚠️ STRIPE PAYMENT FAILED
│
│ 👤 Customer ID: ${customerId}
│ 📧 Email: ${customerEmail}
│ 💰 Valor: R$ ${(invoice.amount_paid / 100).toFixed(2)}
╰──────────────────────────────────────────────────`);

  try {
    // Busca assinante pelo stripe_customer_id ou email
    const existingSubscriber = await sql`
      SELECT id, name FROM subscribers
      WHERE stripe_customer_id = ${customerId}
      OR email = ${customerEmail}
      LIMIT 1
    `;

    if (existingSubscriber.length === 0) {
      const errorMessage = `Assinante não encontrado com Stripe ID: ${customerId} ou Email: ${customerEmail}`;
      await logStripeWebhook(body, 'failed', errorMessage);
      return { success: false, error: errorMessage, status: 404 };
    }

    // Atualiza status para vencido
    await sql`
      UPDATE subscribers SET
        status = 'vencido'
      WHERE id = ${existingSubscriber[0].id}
    `;

    const successMsg = `Assinante marcado como vencido: ${existingSubscriber[0].name} (Stripe ID: ${customerId})`;
    logger.info({ service: 'stripe', customerId }, `
╭──────────────────────────────────────────────────
│ ✅ STRIPE SUBSCRIBER MARKED OVERDUE
│
│ 👤 Nome: ${existingSubscriber[0].name}
│ 🔑 Stripe ID: ${customerId}
╰──────────────────────────────────────────────────`);
    
    await logStripeWebhook(body, 'success', successMsg);
    return { success: true, message: 'Assinante marcado como vencido com sucesso.', status: 200 };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar pagamento falho';
    logError(error, 'Erro ao processar invoice.payment_failed');
    await logStripeWebhook(body, 'failed', errorMessage);
    return { success: false, error: 'Erro interno do servidor.', status: 500 };
  }
}

export async function processStripeWebhook(body: StripeWebhookEvent): Promise<WebhookResult> {
  logWebhookPayload('stripe', body);

  try {
    // Trata formato de array (payload de teste) ou objeto direto
    let event: StripeWebhookEvent;
    if (Array.isArray(body) && (body as unknown[])[0]) {
      const firstItem = (body as unknown as Array<{ body?: StripeWebhookEvent }>)[0];
      event = firstItem.body || (firstItem as unknown as StripeWebhookEvent);
    } else {
      event = body;
    }

    const eventType = event.type;

    logger.info({
      service: 'stripe',
      eventId: event.id,
      eventType
    }, `
╭──────────────────────────────────────────────────
│ 📥 STRIPE WEBHOOK RECEIVED
│
│ 🆔 Event ID: ${event.id}
│ 📋 Type: ${eventType}
│ 🕐 Created: ${new Date(event.created * 1000).toISOString()}
╰──────────────────────────────────────────────────`);

    // Eventos suportados
    if (eventType !== 'invoice.payment_succeeded' && eventType !== 'invoice.payment_failed') {
      logger.info({ service: 'stripe', eventType }, `Evento ${eventType} ignorado - não processado`);
      return { success: true, message: 'Evento não processado.', status: 200 };
    }

    const invoice = event.data?.object;
    if (!invoice) {
      await logStripeWebhook(body, 'failed', 'Dados da fatura (invoice) não encontrados no evento.');
      return { success: false, error: 'Dados da fatura não encontrados.', status: 400 };
    }

    // Processar pagamento falho
    if (eventType === 'invoice.payment_failed') {
      return await processPaymentFailed(body, invoice);
    }

    // Processar pagamento confirmado (invoice.payment_succeeded)
    const customerId = invoice.customer;
    const customerEmail = invoice.customer_email;
    const customerName = invoice.customer_name;
    const customerPhone = invoice.customer_phone ? invoice.customer_phone.replace(/\D/g, '') : null;
    const amountPaid = invoice.amount_paid;
    const subscriptionId = invoice.parent?.subscription_details?.subscription || null;
    const billingReason = invoice.billing_reason;

    logger.info({
      service: 'stripe',
      customerId,
      customerEmail,
      customerName,
      billingReason
    }, `
╭──────────────────────────────────────────────────
│ 💳 STRIPE PAYMENT CONFIRMED
│
│ 👤 Customer ID: ${customerId}
│ 📧 Email: ${customerEmail}
│ 👤 Nome: ${customerName}
│ 📱 Telefone: ${customerPhone || 'N/A'}
│ 💰 Valor: R$ ${(amountPaid / 100).toFixed(2)}
│ 📋 Motivo: ${billingReason || 'N/A'}
│ 🔄 Subscription: ${subscriptionId || 'N/A'}
╰──────────────────────────────────────────────────`);

    // Validação de campos obrigatórios
    if (!customerName || !customerPhone) {
      const missingFields = [];
      if (!customerName) missingFields.push('nome');
      if (!customerPhone) missingFields.push('telefone');

      const errorMessage = `Dados do cliente incompletos. Faltando: ${missingFields.join(', ')}.`;
      await logStripeWebhook(body, 'failed', errorMessage);
      return { success: false, error: errorMessage, status: 400 };
    }

    const value = amountPaid / 100;
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 30);

    // Busca assinante existente pelo stripe_customer_id ou email
    const existingSubscriber = await sql`
      SELECT id, name FROM subscribers
      WHERE stripe_customer_id = ${customerId}
      OR email = ${customerEmail}
      LIMIT 1
    `;

    if (existingSubscriber.length > 0) {
      // Atualização (Renovação ou Reativação)
      await sql`
        UPDATE subscribers SET
          name = ${customerName},
          email = ${customerEmail},
          phone = ${customerPhone},
          next_due_date = ${nextDueDate.toISOString()},
          status = 'ativo',
          stripe_customer_id = ${customerId},
          stripe_subscription_id = ${subscriptionId},
          value = ${value}
        WHERE id = ${existingSubscriber[0].id}
      `;

      const successMsg = `Assinante atualizado/renovado: ${customerName} (Email: ${customerEmail})`;
      logger.info({ service: 'stripe', customerId, customerEmail }, `
╭──────────────────────────────────────────────────
│ ✅ STRIPE SUBSCRIBER UPDATED/RENEWED
│
│ 👤 Nome: ${customerName}
│ 📧 Email: ${customerEmail}
│ 🔑 Stripe ID: ${customerId}
│ 📅 Próximo Vencimento: ${nextDueDate.toISOString().split('T')[0]}
│ 📋 Ação: ${billingReason === 'subscription_create' ? 'REATIVAÇÃO' : 'RENOVAÇÃO'}
╰──────────────────────────────────────────────────`);

      await logStripeWebhook(body, 'success', successMsg);
      return { success: true, message: 'Assinante atualizado com sucesso.', status: 200 };
    } else {
      // Criação (Novo Assinante)
      const newSubscriberResult = await sql`
        INSERT INTO subscribers (name, email, cpf, phone, plan_type, start_date, next_due_date, status, stripe_customer_id, stripe_subscription_id, value, created_at)
        VALUES (${customerName}, ${customerEmail}, ${null}, ${customerPhone}, 'mensal', NOW(), ${nextDueDate.toISOString()}, 'ativo', ${customerId}, ${subscriptionId}, ${value}, NOW())
        RETURNING id
      `;

      const successMsg = `Novo assinante criado: ${customerName} (Email: ${customerEmail})`;
      logger.info({ service: 'stripe', customerId, customerEmail }, `
╭──────────────────────────────────────────────────
│ ✅ STRIPE NEW SUBSCRIBER CREATED
│
│ 👤 Nome: ${customerName}
│ 📧 Email: ${customerEmail}
│ 🔑 Stripe ID: ${customerId}
│ 📅 Próximo Vencimento: ${nextDueDate.toISOString().split('T')[0]}
╰──────────────────────────────────────────────────`);

      await logStripeWebhook(body, 'success', successMsg);

      // Execute WhatsApp cadence for new subscriber (if enabled)
      try {
        const whatsappConfig = await getWhatsAppConfig();
        
        if (whatsappConfig.cadenceEnabled && customerPhone) {
          logger.info({
            subscriberId: newSubscriberResult[0].id,
            subscriberName: customerName,
            phone: customerPhone
          }, 'Starting WhatsApp cadence for new Stripe subscriber');

          const subscriberInfo: SubscriberInfo = {
            id: newSubscriberResult[0].id,
            name: customerName,
            phone: customerPhone,
            subscriptionDate: new Date().toISOString(),
          };

          // Execute cadence asynchronously (don't block webhook response)
          executeCadence(subscriberInfo).then(result => {
            if (result.success) {
              logger.info({
                subscriberId: newSubscriberResult[0].id,
                messagesSucceeded: result.messagesSucceeded
              }, 'WhatsApp cadence completed successfully for Stripe subscriber');
            } else {
              logger.warn({
                subscriberId: newSubscriberResult[0].id,
                messagesFailed: result.messagesFailed,
                errors: result.errors
              }, 'WhatsApp cadence completed with failures for Stripe subscriber');
            }
          }).catch(error => {
            logError(error, 'Error executing WhatsApp cadence for Stripe subscriber');
          });
        } else if (!whatsappConfig.cadenceEnabled) {
          logger.info({
            subscriberId: newSubscriberResult[0].id
          }, 'WhatsApp cadence is disabled, skipping for Stripe subscriber');
        } else if (!customerPhone) {
          logger.info({
            subscriberId: newSubscriberResult[0].id
          }, 'Stripe subscriber has no phone number, skipping WhatsApp cadence');
        }
      } catch (cadenceError) {
        // Don't fail the webhook if cadence fails
        logError(cadenceError, 'Error initiating WhatsApp cadence for Stripe subscriber');
      }

      return { success: true, message: 'Novo assinante criado com sucesso.', status: 200 };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logError(error, 'Erro ao processar webhook do Stripe');
    await logStripeWebhook(body, 'failed', errorMessage);
    return { success: false, error: 'Erro interno do servidor.', status: 500 };
  }
}
