#!/usr/bin/env node
/**
 * Migration runner script
 * Usage: node scripts/run-migration.mjs <migration-file>
 * Example: node scripts/run-migration.mjs migrations/019_create_companies_tables.sql
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load .env file manually
const envPath = resolve(process.cwd(), '.env');
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
  console.error('Please set it in your .env file or environment');
  process.exit(1);
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Please provide a migration file path');
  console.error('Usage: node scripts/run-migration.mjs <migration-file>');
  console.error('Example: node scripts/run-migration.mjs migrations/019_create_companies_tables.sql');
  process.exit(1);
}

async function runMigration() {
  const sql = neon(connectionString);
  
  try {
    const filePath = resolve(process.cwd(), migrationFile);
    const migrationSql = readFileSync(filePath, 'utf-8');
    
    console.log(`🚀 Running migration: ${migrationFile}`);
    console.log('---');
    
    // Remove comments and split by semicolons
    const cleanSql = migrationSql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    // Split by semicolons, keeping only non-empty statements
    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      const preview = statement.replace(/\s+/g, ' ').substring(0, 70);
      console.log(`Executing: ${preview}...`);
      // Execute raw SQL using template literal with the statement directly
      await sql.query(statement);
    }
    
    console.log('---');
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
