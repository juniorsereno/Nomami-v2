[
  {
    "body": {
      "id": "evt_1SVC8JHOQNg4XnOM2WgGoBj8",
      "object": "event",
      "api_version": "2025-08-27.basil",
      "created": 1763561590,
      "data": {
        "object": {
          "id": "in_1SVC87HOQNg4XnOMdHAlqDva",
          "object": "invoice",
          "account_country": "BR",
          "account_name": "noMami ",
          "account_tax_ids": null,
          "amount_due": 2990,
          "amount_overpaid": 0,
          "amount_paid": 2990,
          "amount_remaining": 0,
          "amount_shipping": 0,
          "application": null,
          "attempt_count": 0,
          "attempted": true,
          "auto_advance": false,
          "automatic_tax": {
            "disabled_reason": null,
            "enabled": false,
            "liability": null,
            "provider": null,
            "status": null
          },
          "automatically_finalizes_at": null,
          "billing_reason": "subscription_create",
          "collection_method": "charge_automatically",
          "created": 1763561586,
          "currency": "brl",
          "custom_fields": null,
          "customer": "cus_TS6KX04w045BN9",
          "customer_address": {
            "city": "Formoso",
            "country": "BR",
            "line1": "Saint clair Valadares",
            "line2": "",
            "postal_code": "38690000",
            "state": "Minas Gerais"
          },
          "customer_email": "marissandrasousa@icloud.com",
          "customer_name": "Marissandra Sousa de Deus",
          "customer_phone": "(62) 99700-5200",
          "customer_shipping": null,
          "customer_tax_exempt": "none",
          "customer_tax_ids": [],
          "default_payment_method": null,
          "default_source": null,
          "default_tax_rates": [],
          "description": null,
          "discounts": [],
          "due_date": null,
          "effective_at": 1763561586,
          "ending_balance": 0,
          "footer": null,
          "from_invoice": null,
          "hosted_invoice_url": "https://invoice.stripe.com/i/acct_1SBE9vHOQNg4XnOM/live_YWNjdF8xU0JFOXZIT1FOZzRYbk9NLF9UUzZLUklMN2E3TnJDREM0T1hMWVNSYjVwazdKSklzLDE1NDEwMjM5OQ0200922AEYQd?s=ap",
          "invoice_pdf": "https://pay.stripe.com/invoice/acct_1SBE9vHOQNg4XnOM/live_YWNjdF8xU0JFOXZIT1FOZzRYbk9NLF9UUzZLUklMN2E3TnJDREM0T1hMWVNSYjVwazdKSklzLDE1NDEwMjM5OQ0200922AEYQd/pdf?s=ap",
          "issuer": {
            "type": "self"
          },
          "last_finalization_error": null,
          "latest_revision": null,
          "lines": {
            "object": "list",
            "data": [
              {
                "id": "il_1SVC86HOQNg4XnOMdluq1xyJ",
                "object": "line_item",
                "amount": 2990,
                "currency": "brl",
                "description": "1 × noMami - Assinatura Mensal (a R$ 29.90 / month)",
                "discount_amounts": [],
                "discountable": true,
                "discounts": [],
                "invoice": "in_1SVC87HOQNg4XnOMdHAlqDva",
                "livemode": true,
                "metadata": {},
                "parent": {
                  "invoice_item_details": null,
                  "subscription_item_details": {
                    "invoice_item": null,
                    "proration": false,
                    "proration_details": {
                      "credited_items": null
                    },
                    "subscription": "sub_1SVC89HOQNg4XnOMoa93kOB2",
                    "subscription_item": "si_TS6KO8TI6dkdxf"
                  },
                  "type": "subscription_item_details"
                },
                "period": {
                  "end": 1766153586,
                  "start": 1763561586
                },
                "pretax_credit_amounts": [],
                "pricing": {
                  "price_details": {
                    "price": "price_1SUyGiHOQNg4XnOMHSqLxNl9",
                    "product": "prod_TRs00eb9Wd4ZEJ"
                  },
                  "type": "price_details",
                  "unit_amount_decimal": "2990"
                },
                "quantity": 1,
                "taxes": []
              }
            ],
            "has_more": false,
            "total_count": 1,
            "url": "/v1/invoices/in_1SVC87HOQNg4XnOMdHAlqDva/lines"
          },
          "livemode": true,
          "metadata": {},
          "next_payment_attempt": null,
          "number": "M8V0KX57-0001",
          "on_behalf_of": null,
          "parent": {
            "quote_details": null,
            "subscription_details": {
              "metadata": {},
              "subscription": "sub_1SVC89HOQNg4XnOMoa93kOB2"
            },
            "type": "subscription_details"
          },
          "payment_settings": {
            "default_mandate": null,
            "payment_method_options": {
              "acss_debit": null,
              "bancontact": null,
              "card": {
                "request_three_d_secure": "automatic"
              },
              "customer_balance": null,
              "konbini": null,
              "sepa_debit": null,
              "us_bank_account": null
            },
            "payment_method_types": null
          },
          "period_end": 1763561586,
          "period_start": 1763561586,
          "post_payment_credit_notes_amount": 0,
          "pre_payment_credit_notes_amount": 0,
          "receipt_number": null,
          "rendering": null,
          "shipping_cost": null,
          "shipping_details": null,
          "starting_balance": 0,
          "statement_descriptor": null,
          "status": "paid",
          "status_transitions": {
            "finalized_at": 1763561586,
            "marked_uncollectible_at": null,
            "paid_at": 1763561587,
            "voided_at": null
          },
          "subtotal": 2990,
          "subtotal_excluding_tax": 2990,
          "test_clock": null,
          "total": 2990,
          "total_discount_amounts": [],
          "total_excluding_tax": 2990,
          "total_pretax_credit_amounts": [],
          "total_taxes": [],
          "webhooks_delivered_at": null
        }
      },
      "livemode": true,
      "pending_webhooks": 1,
      "request": {
        "id": null,
        "idempotency_key": "e6ba3e40-a96e-49f4-944c-f79e40cc0bac"
      },
      "type": "invoice.payment_succeeded"
    }
  }
]