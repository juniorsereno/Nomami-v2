import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { logger, logWebhookPayload, logError } from '@/lib/logger';

async function logWebhook(requestBody: Record<string, unknown>, status: 'success' | 'failed', errorMessage?: string) {
  // Log no console via Pino
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
    logger.error({ err: dbError }, 'Falha ao registrar o log do webhook no banco de dados');
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Log do payload recebido (T010)
  logWebhookPayload('stripe', body);

  try {
    // O payload do Stripe pode vir como um evento direto ou dentro de uma lista (embora webhooks geralmente sejam eventos únicos).
    // O exemplo fornecido mostra uma lista `[{ "body": { ... } }]`, o que parece ser um formato customizado ou de teste.
    // Vou assumir que o payload real do Stripe vem como um objeto de evento padrão, mas vou tratar o formato do exemplo também.
    
    let event;
    if (Array.isArray(body) && body[0]?.body) {
        event = body[0].body;
    } else {
        event = body;
    }

    // 1. Validação do Evento
    if (event.type !== 'invoice.payment_succeeded') {
      return NextResponse.json({ message: 'Evento não processado.' }, { status: 200 });
    }

    const invoice = event.data?.object;
    if (!invoice) {
        await logWebhook(body, 'failed', 'Dados da fatura (invoice) não encontrados no evento.');
        return NextResponse.json({ error: 'Dados da fatura não encontrados.' }, { status: 400 });
    }

    // 2. Extração de Dados
    const customerId = invoice.customer;
    const customerEmail = invoice.customer_email;
    const customerName = invoice.customer_name;
    const customerPhone = invoice.customer_phone ? invoice.customer_phone.replace(/\D/g, '') : null;
    const amountPaid = invoice.amount_paid; // Valor em centavos
    
    // Validação de campos obrigatórios
    if (!customerName || !customerPhone) {
        const missingFields = [];
        if (!customerName) missingFields.push('nome');
        if (!customerPhone) missingFields.push('telefone');
        
        const errorMessage = `Dados do cliente incompletos. Faltando: ${missingFields.join(', ')}.`;
        await logWebhook(body, 'failed', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // O Stripe envia o valor em centavos (ex: 2990 para R$ 29,90).
    // O banco parece esperar um numeric/decimal. Vamos converter se necessário.
    const value = amountPaid / 100;

    // O CPF não vem nativamente no objeto invoice do Stripe a menos que esteja em metadata ou custom fields.
    // No exemplo fornecido, não vejo um campo explícito de CPF no nível raiz do invoice ou customer_details.
    // No entanto, o código anterior usava `cpfCnpj` do Asaas.
    // Se o CPF não estiver disponível, teremos um problema com a constraint UNIQUE(cpf).
    // Vou verificar se existe algum campo customizado ou se vamos usar o email como chave secundária.
    // Pelo exemplo: "customer_tax_ids": [] está vazio.
    
    // Assumindo que o CPF possa vir em metadata ou que o sistema aceite NULL se não tiver (mas a constraint é unique, então nulls são permitidos mas múltiplos nulls ok).
    // Mas o código anterior fazia UPSERT pelo CPF.
    // Se não tivermos CPF, vamos tentar fazer UPSERT pelo email ou stripe_customer_id.
    // Como a migração adicionou stripe_customer_id, podemos usar isso para identificar o usuário recorrente.
    
    // ESTRATÉGIA:
    // 1. Tentar encontrar o usuário pelo email ou stripe_customer_id.
    // 2. Se encontrar, atualizar.
    // 3. Se não encontrar, criar novo.
    // OBS: Sem CPF, não podemos garantir a unicidade do CPF se ele for obrigatório e não nulo.
    // O schema diz: cpf character varying NULL. Então pode ser nulo.
    
    // Vamos tentar extrair o CPF de algum lugar se possível, senão vai NULL.
    const cpf = null; // Não tem no payload padrão do exemplo.

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 30);

    // 3. Cadastro ou Atualização do Assinante
    // Usando stripe_customer_id como chave principal de busca/atualização se existir, ou email.
    
    // Primeiro, verificamos se já existe um assinante com esse stripe_customer_id ou email.
    // A query original fazia UPSERT no CPF. Agora o CPF pode não vir.
    // Vamos alterar a lógica para priorizar o stripe_customer_id, depois email.
    
    // Como o SQL `ON CONFLICT` exige uma constraint única, e stripe_customer_id não tem constraint única (ainda, acabamos de criar a coluna),
    // e email também não parece ter (apenas id e cpf tem unique indexes no schema mostrado),
    // vamos fazer um SELECT antes para decidir entre INSERT ou UPDATE.
    
    const existingSubscriber = await sql`
        SELECT id FROM subscribers 
        WHERE stripe_customer_id = ${customerId} 
        OR email = ${customerEmail}
        LIMIT 1
    `;

    if (existingSubscriber.length > 0) {
        // Atualizar
        await sql`
            UPDATE subscribers SET
                name = ${customerName},
                email = ${customerEmail},
                phone = ${customerPhone},
                next_due_date = ${nextDueDate.toISOString()},
                status = 'active',
                stripe_customer_id = ${customerId},
                value = ${value}
            WHERE id = ${existingSubscriber[0].id}
        `;
    } else {
        // Inserir
        await sql`
            INSERT INTO subscribers (name, email, cpf, phone, plan_type, start_date, next_due_date, status, stripe_customer_id, value, created_at)
            VALUES (${customerName}, ${customerEmail}, ${cpf}, ${customerPhone}, 'mensal', NOW(), ${nextDueDate.toISOString()}, 'active', ${customerId}, ${value}, NOW())
        `;
    }

    await logWebhook(body, 'success');
    return NextResponse.json({ message: 'Webhook processado com sucesso.' }, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logError(error, 'Erro ao processar webhook do Stripe');
    await logWebhook(body, 'failed', errorMessage);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}