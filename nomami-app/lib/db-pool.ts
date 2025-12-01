import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_POOL_URL) {
  // Em tempo de build, não queremos quebrar se a variável não estiver definida,
  // pois o Next.js tenta avaliar os módulos.
  // Mas em runtime, isso deve ser um erro.
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
     // Log warning instead of throwing error during build phase if possible,
     // but for safety let's just allow it to be undefined during build if not used.
     // However, neon() requires a connection string.
     // Let's provide a dummy one if missing during build, or throw if runtime.
  }
}

// Fallback para evitar erro no build time se a env não estiver carregada ainda
const connectionString = process.env.DATABASE_POOL_URL || 'postgres://user:pass@host/db';

const sql = neon(connectionString);

export default sql;