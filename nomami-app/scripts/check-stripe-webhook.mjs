#!/usr/bin/env node
/**
 * Check Stripe Webhook Processing
 * Verifies if a specific Stripe webhook was processed and checks subscriber status
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file manually
const envPath = resolve(__dirname, '..', '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=["']?(.+?)["']?$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const connectionString = process.env.DATABASE_POOL_URL;

if (!connectionString) {
  console.error('❌ DATABASE_POOL_URL environment variable is not set');
  process.exit(1);
}

async function checkWebhook() {
  const sql = neon(connectionString);
  
  try {
    const eventId = 'evt_1SquQoHOQNg4XnOMsFp2Rac4';
    const customerId = 'cus_TcuWsvxkFUIgHT';
    const customerEmail = 'lauramendesluiz@gmail.com';
    
    console.log('🔍 Buscando logs do Stripe para o evento:', eventId, '\n');
    
    const logs = await sql`
      SELECT 
        id,
        status,
        error_message,
        created_at,
        request_body::json->>'id' as event_id,
        request_body::json->>'type' as event_type,
        request_body::json->'data'->'object'->>'customer' as customer_id,
        request_body::json->'data'->'object'->>'customer_email' as customer_email
      FROM stripe_webhook_logs
      WHERE request_body::json->>'id' = ${eventId}
      ORDER BY created_at DESC
      LIMIT 5
    `;

    if (logs.length === 0) {
      console.log('❌ Nenhum log encontrado para este evento!');
      console.log('\nIsso significa que o webhook pode não ter sido recebido ou processado.\n');
      
      console.log('📊 Últimos 5 logs do Stripe:');
      const recentLogs = await sql`
        SELECT 
          id,
          status,
          error_message,
          created_at,
          request_body::json->>'id' as event_id,
          request_body::json->>'type' as event_type
        FROM stripe_webhook_logs
        ORDER BY created_at DESC
        LIMIT 5
      `;
      
      console.table(recentLogs);
    } else {
      console.log('✅ Log encontrado!\n');
      console.table(logs);
      
      if (logs[0].status === 'failed') {
        console.log('\n❌ ERRO:', logs[0].error_message);
      }
    }

    // Verificar se o assinante existe
    console.log('\n🔍 Verificando assinante...\n');
    const subscriber = await sql`
      SELECT 
        id, 
        name, 
        email, 
        phone,
        status,
        stripe_customer_id,
        stripe_subscription_id,
        next_due_date,
        expired_at,
        created_at
      FROM subscribers
      WHERE stripe_customer_id = ${customerId}
      OR email = ${customerEmail}
      LIMIT 1
    `;

    if (subscriber.length === 0) {
      console.log('❌ Assinante não encontrado no banco de dados!');
      console.log('\nPossíveis causas:');
      console.log('1. O webhook não foi processado');
      console.log('2. Houve erro na criação/atualização do assinante');
      console.log('3. O assinante foi criado com email/customer_id diferente');
    } else {
      console.log('✅ Assinante encontrado:');
      console.table(subscriber);
      
      if (subscriber[0].status !== 'ativo') {
        console.log('\n⚠️ ATENÇÃO: Status do assinante não é "ativo"!');
      }
      
      if (!subscriber[0].next_due_date) {
        console.log('\n⚠️ ATENÇÃO: next_due_date não está definido!');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  }
}

checkWebhook();
