import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';

const connectionString = process.env.PG_DB_URL;

if (!connectionString) {
  throw new Error('PG_DB_URL environment variable is required');
}

const client = postgres(connectionString);
export const db = drizzle(client);
