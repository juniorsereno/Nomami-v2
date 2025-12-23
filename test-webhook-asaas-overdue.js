// Script para testar o webhook PAYMENT_OVERDUE do Asaas
// Uso: node test-webhook-asaas-overdue.js

const payload = {
  "id": "evt_071da53af2a9613df04213d0157d6b88&1157318130",
  "event": "PAYMENT_OVERDUE",
  "dateCreated": "2025-12-15 03:01:46",
  "payment": {
    "object": "payment",
    "id": "pay_c3nhgchrbbkauin5",
    "dateCreated": "2025-11-12",
    "customer": "cus_000146784965",
    "subscription": "sub_01oq5hujqfrbuarf",
    "checkoutSession": null,
    "paymentLink": "753fqpwdbt3x9nek",
    "value": 29.9,
    "netValue": 28.52,
    "originalValue": null,
    "interestValue": null,
    "description": "",
    "billingType": "CREDIT_CARD",
    "confirmedDate": null,
    "creditCard": {
      "creditCardNumber": null,
      "creditCardBrand": null
    },
    "pixTransaction": null,
    "status": "OVERDUE",
    "dueDate": "2025-12-12",
    "originalDueDate": "2025-12-12",
    "paymentDate": null,
    "clientPaymentDate": null,
    "installmentNumber": null,
    "invoiceUrl": "https://www.asaas.com/i/c3nhgchrbbkauin5",
    "invoiceNumber": "677916638",
    "externalReference": null,
    "deleted": false,
    "anticipated": false,
    "anticipable": false,
    "creditDate": null,
    "estimatedCreditDate": null,
    "transactionReceiptUrl": null,
    "nossoNumero": null,
    "bankSlipUrl": null,
    "lastInvoiceViewedDate": null,
    "lastBankSlipViewedDate": null,
    "discount": {
      "value": 0,
      "limitDate": null,
      "dueDateLimitDays": 0,
      "type": "FIXED"
    },
    "fine": {
      "value": 0,
      "type": "FIXED"
    },
    "interest": {
      "value": 0,
      "type": "PERCENTAGE"
    },
    "postalService": false,
    "escrow": null,
    "refunds": null
  }
};

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://api-nomami.idu6le.easypanel.host/api/webhook/asaas';

async function testWebhook() {
  console.log('🚀 Testando webhook PAYMENT_OVERDUE do Asaas...');
  console.log('📍 URL:', WEBHOOK_URL);
  console.log('📦 Evento:', payload.event);
  console.log('👤 Cliente:', payload.payment.customer);
  console.log('📅 Data de Vencimento:', payload.payment.dueDate);
  console.log('💰 Valor:', payload.payment.value);
  console.log('\n⏳ Enviando requisição...\n');

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('📊 Status:', response.status, response.statusText);
    
    const contentType = response.headers.get('content-type');
    let responseBody;
    
    if (contentType && contentType.includes('application/json')) {
      responseBody = await response.json();
      console.log('✅ Resposta JSON:', JSON.stringify(responseBody, null, 2));
    } else {
      responseBody = await response.text();
      console.log('📄 Resposta Text:', responseBody);
    }

    if (response.ok) {
      console.log('\n✅ Webhook PAYMENT_OVERDUE processado com sucesso!');
      console.log('📝 O assinante deve estar marcado como "vencido" no banco de dados');
    } else {
      console.log('\n❌ Webhook falhou!');
    }

  } catch (error) {
    console.error('\n❌ Erro ao testar webhook:', error.message);
    if (error.cause) {
      console.error('Causa:', error.cause);
    }
  }
}

testWebhook();
