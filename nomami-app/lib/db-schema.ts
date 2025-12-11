/**
 * Database schema definition.
 * 
 * Note: Since we are using raw SQL with Neon (via @neondatabase/serverless),
 * this file serves as the documentation and source of truth for our schema.
 * We will execute migrations manually or via a script using these definitions.
 */

export const schema = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      cpf VARCHAR(14) UNIQUE NOT NULL,
      password VARCHAR(255),
      role VARCHAR(50) DEFAULT 'USER' NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,
  // Other tables would go here
};