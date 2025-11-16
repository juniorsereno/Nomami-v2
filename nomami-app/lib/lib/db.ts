import { neon } from '@neondatabase/serverless';

// A URL de conexão deve ser armazenada em variáveis de ambiente
const sql = neon(process.env.DATABASE_URL!);

export default sql;