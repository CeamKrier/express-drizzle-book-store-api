import 'dotenv/config';

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const db = drizzle(process.env.PG_DB_URL as string);

async function main() {
  await migrate(db, {
    migrationsFolder: './src/database/migrations',
  });
}

main().catch(console.error);
