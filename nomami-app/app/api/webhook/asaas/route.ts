import { NextResponse } from 'next/server';
import sql from '@/lib/db';

async function logWebhook(requestBody: any, status: 'success' | 'failed', errorMessage?: string) {
  try {
    await sql`
      INSERT INTO asaas_webhook_logs (request_body, status, error_message)
      VALUES (${JSON.stringify(requestBody)}, ${status}, ${errorMessage || null})
    `;
  } catch (dbError) {
    console.error('Falha ao registrar o log do webhook no banco de dados:', dbError);
  }
}

export async function POST(request: Request) {
  const body = await request.json();

  try {
    // 1. Validação do Evento
    if (body.event !== 'PAYMENT_CONFIRMED') {
      return NextResponse.json({ message: 'Evento não processado.' }, { status: 200 });
    }

    const customerId = body.payment?.customer;
    if (!customerId) {
      await logWebhook(body, 'failed', 'ID do cliente (customer) não encontrado no corpo do webhook.');
      return NextResponse.json({ error: 'ID do cliente não encontrado.' }, { status: 400 });
    }

    // 2. Chamada à API do Asaas
    const apiToken = process.env.ASAAS_API_KEY;
    if (!apiToken) {
      console.error('A variável de ambiente ASAAS_API_KEY não está definida.');
      await logWebhook(body, 'failed', 'A variável de ambiente ASAAS_API_KEY não está configurada no servidor.');
      return NextResponse.json({ error: 'Erro de configuração interna.' }, { status: 500 });
    }

    const response = await fetch(`https://api.asaas.com/v3/customers/${customerId}`, {
      headers: {
        'accept': 'application/json',
        'access_token': apiToken,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = `Falha ao buscar dados do cliente na API do Asaas. Status: ${response.status}. Resposta: ${errorText}`;
      await logWebhook(body, 'failed', errorMessage);
      return NextResponse.json({ error: 'Falha ao comunicar com o gateway de pagamento.' }, { status: 502 });
    }

    const customerData = await response.json();
    const customer = Array.isArray(customerData) ? customerData[0] : customerData;

    if (!customer) {
        await logWebhook(body, 'failed', 'Nenhum dado de cliente retornado pela API do Asaas.');
        return NextResponse.json({ error: 'Dados do cliente não encontrados.' }, { status: 404 });
    }


    // 3. Cadastro ou Atualização do Assinante
    const { name, email, cpfCnpj, mobilePhone } = customer;
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 30);

    await sql`
      INSERT INTO subscribers (name, email, cpf, phone, plan_type, start_date, next_due_date, status, asaas_customer_id)
      VALUES (${name}, ${email}, ${cpfCnpj}, ${mobilePhone}, 'mensal', NOW(), ${nextDueDate.toISOString()}, 'active', ${customerId})
      ON CONFLICT (cpf) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        next_due_date = EXCLUDED.next_due_date,
        status = 'active',
        asaas_customer_id = EXCLUDED.asaas_customer_id;
    `;

    await logWebhook(body, 'success');
    return NextResponse.json({ message: 'Webhook processado com sucesso.' }, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao processar webhook do Asaas:', error);
    await logWebhook(body, 'failed', errorMessage);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}