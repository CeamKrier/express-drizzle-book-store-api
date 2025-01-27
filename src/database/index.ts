import postgres from 'postgres';
import { trace } from '@opentelemetry/api';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import { logger } from '@/logger';

const connectionString = process.env.PG_DB_URL;

if (!connectionString) {
  throw new Error('PG_DB_URL environment variable is required');
}

console.log('Connecting to PostgreSQL database...');

const client = postgres(connectionString, {
  onclose(connId) {
    console.log('Postgres connection closed:', connId);
  },
});
export const db = drizzle(client, {
  logger: {
    logQuery(query, params) {
      logger.info('Executing query', { query, params });
      const span = trace.getActiveSpan();
      if (span) {
        span.setAttributes({
          'db.query': query,
          'db.params': JSON.stringify(params),
          'db.operation': getQueryOperation(query),
        });
      }
    },
  },
});

function getQueryOperation(query: string): string {
  const firstWord = query.split(' ')[0].toLowerCase();
  return ['select', 'insert', 'update', 'delete'].includes(firstWord) ? firstWord : 'other';
}
