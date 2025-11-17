import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_POOL_URL) {
  throw new Error('DATABASE_POOL_URL is not set in .env file');
}

const sql = neon(process.env.DATABASE_POOL_URL);

export default sql;