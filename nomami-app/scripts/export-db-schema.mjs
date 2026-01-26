#!/usr/bin/env node
/**
 * Database Schema Export Script
 * Exports the complete database schema from PostgreSQL to a markdown file
 * Usage: cd nomami-app && node scripts/export-db-schema.mjs
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, existsSync, writeFileSync } from 'fs';
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
  console.error('Please set it in your .env file or environment');
  process.exit(1);
}

async function exportSchema() {
  const sql = neon(connectionString);
  
  try {
    console.log('🔍 Extracting database schema...\n');
    
    // Get all schemas
    const schemas = await sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name;
    `;
    
    let schemaOutput = '';
    
    // Export schema creation statements
    for (const schema of schemas) {
      schemaOutput += `CREATE SCHEMA "${schema.schema_name}";\n`;
    }
    
    // Get all custom types (ENUMs)
    const types = await sql`
      SELECT 
        t.typname as type_name,
        string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname;
    `;
    
    for (const type of types) {
      const values = type.enum_values.split(', ').map(v => `'${v}'`).join(', ');
      schemaOutput += `CREATE TYPE "${type.type_name}" AS ENUM(${values});\n`;
    }
    
    // Get all tables with their columns
    const tables = await sql`
      SELECT 
        table_schema,
        table_name
      FROM information_schema.tables
      WHERE table_schema IN ('public', 'auth', 'neon_auth', 'pgrst')
        AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name;
    `;
    
    for (const table of tables) {
      const fullTableName = table.table_schema === 'public' 
        ? `"${table.table_name}"`
        : `"${table.table_schema}"."${table.table_name}"`;
      
      // Get columns
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          is_nullable,
          column_default,
          udt_name
        FROM information_schema.columns
        WHERE table_schema = ${table.table_schema}
          AND table_name = ${table.table_name}
        ORDER BY ordinal_position;
      `;
      
      schemaOutput += `CREATE TABLE ${fullTableName} (\n`;
      
      const columnDefs = [];
      for (const col of columns) {
        let colDef = `\t"${col.column_name}" `;
        
        // Handle data type
        if (col.data_type === 'character varying') {
          colDef += `varchar(${col.character_maximum_length || 255})`;
        } else if (col.data_type === 'numeric') {
          colDef += `numeric(${col.numeric_precision}, ${col.numeric_scale})`;
        } else if (col.data_type === 'USER-DEFINED') {
          colDef += col.udt_name;
        } else if (col.data_type === 'timestamp with time zone') {
          colDef += 'timestamp with time zone';
        } else if (col.data_type === 'timestamp without time zone') {
          colDef += 'timestamp';
        } else {
          colDef += col.data_type;
        }
        
        // Handle constraints
        if (col.column_default) {
          if (col.column_default.includes('PRIMARY KEY')) {
            colDef += ' PRIMARY KEY';
          } else if (col.column_default.includes('UNIQUE')) {
            colDef += ' UNIQUE';
          }
          
          // Add default value
          let defaultVal = col.column_default;
          if (!defaultVal.includes('PRIMARY KEY') && !defaultVal.includes('UNIQUE')) {
            colDef += ` DEFAULT ${defaultVal}`;
          }
        }
        
        if (col.is_nullable === 'NO' && !col.column_default?.includes('PRIMARY KEY')) {
          colDef += ' NOT NULL';
        }
        
        columnDefs.push(colDef);
      }
      
      // Get primary key
      const primaryKey = await sql`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = (${table.table_schema} || '.' || ${table.table_name})::regclass
          AND i.indisprimary;
      `;
      
      if (primaryKey.length > 0 && !columnDefs.some(def => def.includes('PRIMARY KEY'))) {
        const pkCols = primaryKey.map(pk => `"${pk.attname}"`).join(', ');
        columnDefs.push(`\tPRIMARY KEY (${pkCols})`);
      }
      
      // Get unique constraints
      const uniqueConstraints = await sql`
        SELECT 
          con.conname as constraint_name,
          string_agg(att.attname, ', ' ORDER BY u.attposition) as columns
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS u(attnum, attposition) ON true
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = u.attnum
        WHERE nsp.nspname = ${table.table_schema}
          AND rel.relname = ${table.table_name}
          AND con.contype = 'u'
        GROUP BY con.conname;
      `;
      
      for (const uc of uniqueConstraints) {
        if (!columnDefs.some(def => def.includes(`CONSTRAINT "${uc.constraint_name}"`))) {
          columnDefs.push(`\tCONSTRAINT "${uc.constraint_name}" UNIQUE`);
        }
      }
      
      // Get check constraints
      const checkConstraints = await sql`
        SELECT 
          con.conname as constraint_name,
          pg_get_constraintdef(con.oid) as definition
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = ${table.table_schema}
          AND rel.relname = ${table.table_name}
          AND con.contype = 'c';
      `;
      
      for (const cc of checkConstraints) {
        columnDefs.push(`\tCONSTRAINT "${cc.constraint_name}" ${cc.definition}`);
      }
      
      schemaOutput += columnDefs.join(',\n');
      schemaOutput += '\n);\n';
    }
    
    // Get foreign keys
    const foreignKeys = await sql`
      SELECT 
        tc.table_schema,
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
        AND rc.constraint_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema IN ('public', 'auth', 'neon_auth', 'pgrst')
      ORDER BY tc.table_schema, tc.table_name;
    `;
    
    for (const fk of foreignKeys) {
      const tableName = fk.table_schema === 'public' 
        ? `"${fk.table_name}"`
        : `"${fk.table_schema}"."${fk.table_name}"`;
      
      const foreignTableName = fk.foreign_table_schema === 'public'
        ? `"${fk.foreign_table_name}"`
        : `"${fk.foreign_table_schema}"."${fk.foreign_table_name}"`;
      
      schemaOutput += `ALTER TABLE ${tableName} ADD CONSTRAINT "${fk.constraint_name}" `;
      schemaOutput += `FOREIGN KEY ("${fk.column_name}") `;
      schemaOutput += `REFERENCES ${foreignTableName}("${fk.foreign_column_name}")`;
      
      if (fk.delete_rule !== 'NO ACTION') {
        schemaOutput += ` ON DELETE ${fk.delete_rule}`;
      }
      if (fk.update_rule !== 'NO ACTION') {
        schemaOutput += ` ON UPDATE ${fk.update_rule}`;
      }
      
      schemaOutput += ';\n';
    }
    
    // Get indexes
    const indexes = await sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname IN ('public', 'auth', 'neon_auth', 'pgrst')
      ORDER BY schemaname, tablename, indexname;
    `;
    
    for (const idx of indexes) {
      schemaOutput += `${idx.indexdef};\n`;
    }
    
    // Write to file (root of project, not nomami-app)
    const outputPath = resolve(__dirname, '..', '..', 'db-schema.md');
    writeFileSync(outputPath, schemaOutput, 'utf-8');
    
    console.log('✅ Schema exported successfully!');
    console.log(`📄 File: ${outputPath}`);
    console.log(`📊 Tables: ${tables.length}`);
    console.log(`🔑 Foreign Keys: ${foreignKeys.length}`);
    console.log(`📇 Indexes: ${indexes.length}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

exportSchema();
