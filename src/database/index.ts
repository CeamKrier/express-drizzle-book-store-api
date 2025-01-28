import postgres from 'postgres';
import { trace } from '@opentelemetry/api';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';

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
      const tracer = trace.getTracer('database-operations');

      return tracer.startActiveSpan('database.query', (span) => {
        try {
          // Add detailed attributes to the span
          span.setAttributes({
            'db.system': 'postgresql',
            'db.statement': query,
            'db.operation': getQueryOperation(query),
            'db.params': JSON.stringify(params),
          });

          return span;
        } finally {
          // Ensure span is ended after query execution
          span.end();
        }
      });
    },
  },
});

function getQueryOperation(query: string): string {
  const firstWord = query.split(' ')[0].toLowerCase();
  return ['select', 'insert', 'update', 'delete'].includes(firstWord) ? firstWord : 'other';
}
