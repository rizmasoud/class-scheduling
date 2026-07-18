import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/core/database/schema/*', // Path to your schema files
  out: './src/core/database/migrations',   // Where migrations will be output
  dbCredentials: {
    // For local dev with Drizzle Kit, we can use a dummy or a local sqlite file.
    // In production, Tauri handles the real database path internally.
    url: 'sqlite.db',
  },
});
