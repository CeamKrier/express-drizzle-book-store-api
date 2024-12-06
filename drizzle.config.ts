import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/database/schema/*.ts",
    out: "./src/database/migrations",
    dbCredentials: {
        url: process.env.PG_DB_URL as string
    },
    verbose: true,
    strict: true,
    entities: {
        roles: true
    }
});
