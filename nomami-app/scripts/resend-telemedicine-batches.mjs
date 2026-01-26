#!/usr/bin/env node
/**
 * Script para reenviar lotes de telemedicina
 * Uso: node scripts/resend-telemedicine-batches.mjs [batchIds]
 * Exemplos:
 *   node scripts/resend-telemedicine-batches.mjs           # Reenvia todos os lotes ativos
 *   node scripts/resend-telemedicine-batches.mjs 1 2 3     # Reenvia lotes específicos
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
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
const apiUser = process.env.TELEMEDICINE_API_USER;
const apiPassword = process.env.TELEMEDICINE_API_PASSWORD;
const webhookUrl = process.env.TELEMEDICINE_WEBHOOK_URL;

if (!connectionString) {
  console.error('❌ DATABASE_POOL_URL não configurada');
  process.exit(1);
}

if (!apiUser || !apiPassword) {
  console.error('❌ Credenciais da API de Telemedicina não configuradas');
  process.exit(1);
}

if (!webhookUrl) {
  console.error('❌ TELEMEDICINE_WEBHOOK_URL não configurada');
  process.exit(1);
}

const sql = neon(connectionString);

async function resendBatches() {
  try {
    const batchIds = process.argv.slice(2).map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    
    console.log('🚀 Iniciando reenvio de lotes de telemedicina\n');

    // 1. Buscar lotes
    let batches;
    if (batchIds.length > 0) {
      console.log(`📋 Buscando lotes específicos: ${batchIds.join(', ')}`);
      batches = await sql`
        SELECT id, batch_identifier, status
        FROM telemedicine_batches
        WHERE id = ANY(${batchIds}) AND status = 'ativo'
        ORDER BY id;
      `;
    } else {
      console.log('📋 Buscando todos os lotes ativos');
      batches = await sql`
        SELECT id, batch_identifier, status
        FROM telemedicine_batches
        WHERE status = 'ativo'
        ORDER BY id;
      `;
    }

    if (batches.length === 0) {
      console.log('ℹ️  Nenhum lote ativo encontrado');
      return;
    }

    console.log(`✅ Encontrados ${batches.length} lote(s) para reenviar\n`);

    // 2. Processar cada lote
    const results = {
      processed: 0,
      success: 0,
      failed: 0,
    };

    for (const batch of batches) {
      results.processed++;
      console.log(`\n📦 Processando Lote #${batch.id}: ${batch.batch_identifier}`);

      try {
        // Buscar clientes
        const clients = await sql`
          SELECT full_name, cpf, birth_date, gender, cellphone
          FROM telemedicine_clients
          WHERE batch_id = ${batch.id}
          ORDER BY id;
        `;

        if (clients.length === 0) {
          console.log(`   ⚠️  Lote sem clientes, pulando`);
          results.failed++;
          continue;
        }

        console.log(`   👥 ${clients.length} cliente(s) encontrado(s)`);

        // Montar payload
        const apiBody = clients.map(client => ({
          'Sequencial': '',
          'Nome*': client.full_name,
          'CPF*': client.cpf,
          'Data_Nascimento*': client.birth_date,
          'Sexo*': client.gender,
          'Celular*': client.cellphone,
          'E-mail': '',
          'rg': '',
          'fone': '',
          'cep': '',
          'estado': '',
          'cidade': '',
          'bairro': '',
          'CPF_TITULAR': '',
          'relacao_dependente': '',
          'ID_PLANO*': 7,
          'ACAO*': 'A',
          'Grupo': '',
        }));

        // Enviar para API
        console.log(`   📤 Enviando para API...`);
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${apiUser}:${apiPassword}`).toString('base64'),
          },
          body: JSON.stringify(apiBody),
        });

        const responseStatus = response.status;

        if (!response.ok) {
          const errorText = await response.text();
          const errorMessage = `${response.statusText}: ${errorText}`;
          console.log(`   ❌ Erro: ${errorMessage}`);
          
          // Salvar log de erro
          await sql`
            INSERT INTO telemedicine_api_logs (batch_id, request_body, response_status, error_message)
            VALUES (${batch.id}, ${JSON.stringify(apiBody)}, ${responseStatus}, ${errorMessage});
          `;
          
          results.failed++;
        } else {
          const responseData = await response.json();
          console.log(`   ✅ Sucesso! Status: ${responseStatus}`);
          
          // Salvar log de sucesso
          await sql`
            INSERT INTO telemedicine_api_logs (batch_id, request_body, response_status, response_body)
            VALUES (${batch.id}, ${JSON.stringify(apiBody)}, ${responseStatus}, ${JSON.stringify(responseData)});
          `;
          
          results.success++;
        }

        // Delay entre requisições
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.log(`   ❌ Erro ao processar: ${error.message}`);
        results.failed++;
      }
    }

    // Resumo
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DO REENVIO');
    console.log('='.repeat(50));
    console.log(`Processados: ${results.processed}`);
    console.log(`✅ Sucesso:  ${results.success}`);
    console.log(`❌ Falhas:   ${results.failed}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

resendBatches();
