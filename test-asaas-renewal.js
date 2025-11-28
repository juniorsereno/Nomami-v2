const payload = {
  "id": "evt_renewal_test",
  "event": "PAYMENT_CONFIRMED",
  "dateCreated": "2025-12-25 14:26:01", // Data do evento (hoje + 30 dias)
  "payment": {
    "object": "payment",
    "id": "pay_renewal_test",
    "dateCreated": "2025-11-25", // Data do pagamento original (hoje) - Diferença de 30 dias
    "customer": "cus_000149857757",
    "subscription": "sub_fho3iprt06ir5agq",
    "value": 29.9,
    "netValue": 28.52,
    "billingType": "CREDIT_CARD",
    "status": "CONFIRMED",
    "dueDate": "2025-11-25",
    "originalDueDate": "2025-11-25",
    "clientPaymentDate": "2025-11-25",
    "invoiceUrl": "https://www.asaas.com/i/qf7gz7zgtg7kn2cm",
    "invoiceNumber": "686766142",
    "deleted": false,
    "anticipated": false,
    "anticipable": false,
    "creditDate": "2025-12-29",
    "estimatedCreditDate": "2025-12-29",
    "transactionReceiptUrl": "https://www.asaas.com/comprovantes/3176427500973382",
    "postalService": false
  }
};

async function testWebhook() {
  try {
    const response = await fetch('http://localhost:3000/api/webhook/asaas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Erro ao testar webhook:', error);
  }
}

testWebhook();