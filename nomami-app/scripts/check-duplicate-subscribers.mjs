#!/usr/bin/env node
/**
 * Check for Duplicate Subscribers
 * Identifies potential duplicate subscribers from Asaas/Stripe migration
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

async function checkDuplicates() {
  const sql = neon(connectionString);
  
  try {
    console.log('🔍 Verificando duplicações de assinantes...\n');
    
    // 1. Emails duplicados
    console.log('📧 Emails duplicados (possível migração):');
    const duplicateEmails = await sql`
      SELECT 
        email,
        COUNT(*) as count,
        STRING_AGG(id::text, ', ') as subscriber_ids,
        STRING_AGG(COALESCE(asaas_customer_id, 'NULL'), ', ') as asaas_ids,
        STRING_AGG(COALESCE(stripe_customer_id, 'NULL'), ', ') as stripe_ids,
        STRING_AGG(status, ', ') as statuses
      FROM subscribers
      WHERE email IS NOT NULL
      GROUP BY email
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    
    if (duplicateEmails.length === 0) {
      console.log('✅ Nenhum email duplicado encontrado\n');
    } else {
      console.table(duplicateEmails);
      console.log(`⚠️ Total: ${duplicateEmails.length} emails duplicados\n`);
    }
    
    // 2. Telefones duplicados
    console.log('📱 Telefones duplicados:');
    const duplicatePhones = await sql`
      SELECT 
        phone,
        COUNT(*) as count,
        STRING_AGG(id::text, ', ') as subscriber_ids,
        STRING_AGG(COALESCE(email, 'NULL'), ', ') as emails,
        STRING_AGG(status, ', ') as statuses
      FROM subscribers
      WHERE phone IS NOT NULL
      GROUP BY phone
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    
    if (duplicatePhones.length === 0) {
      console.log('✅ Nenhum telefone duplicado encontrado\n');
    } else {
      console.table(duplicatePhones);
      console.log(`⚠️ Total: ${duplicatePhones.length} telefones duplicados\n`);
    }
    
    // 3. Assinantes com ambos Asaas e Stripe
    console.log('🔄 Assinantes com dados de Asaas E Stripe (migrados):');
    const migratedSubscribers = await sql`
      SELECT 
        id,
        name,
        email,
        cpf,
        status,
        asaas_customer_id,
        stripe_customer_id,
        created_at
      FROM subscribers
      WHERE asaas_customer_id IS NOT NULL 
        AND stripe_customer_id IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    if (migratedSubscribers.length === 0) {
      console.log('✅ Nenhum assinante migrado encontrado\n');
    } else {
      console.table(migratedSubscribers);
      console.log(`📊 Total de assinantes migrados: ${migratedSubscribers.length}\n`);
    }
    
    // 4. Assinantes apenas Asaas
    const asaasOnly = await sql`
      SELECT COUNT(*) as count
      FROM subscribers
      WHERE asaas_customer_id IS NOT NULL 
        AND stripe_customer_id IS NULL
    `;
    
    // 5. Assinantes apenas Stripe
    const stripeOnly = await sql`
      SELECT COUNT(*) as count
      FROM subscribers
      WHERE stripe_customer_id IS NOT NULL 
        AND asaas_customer_id IS NULL
    `;
    
    // 6. Resumo
    console.log('📊 RESUMO:');
    console.log('─────────────────────────────────────');
    console.log(`Apenas Asaas: ${asaasOnly[0].count}`);
    console.log(`Apenas Stripe: ${stripeOnly[0].count}`);
    console.log(`Migrados (ambos): ${migratedSubscribers.length}`);
    console.log(`Emails duplicados: ${duplicateEmails.length}`);
    console.log(`Telefones duplicados: ${duplicatePhones.length}`);
    console.log('─────────────────────────────────────\n');
    
    // 7. Recomendações
    if (duplicateEmails.length > 0 || duplicatePhones.length > 0) {
      console.log('⚠️ ATENÇÃO: Duplicações encontradas!');
      console.log('\nRecomendações:');
      console.log('1. Revisar registros duplicados manualmente');
      console.log('2. Implementar busca por CPF no handler do Stripe');
      console.log('3. Considerar merge de registros duplicados');
      console.log('4. Adicionar validação de CPF no checkout do Stripe\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  }
}

checkDuplicates();
