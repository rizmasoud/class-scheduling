import { initializeDrizzle } from './drizzle';
export type AppDatabase = ReturnType<typeof initializeDrizzle>;
// Extracts the transaction type from the database's transaction method
export type AppTransaction = Parameters<Parameters<AppDatabase['transaction']>[0]>[0];
export type DbExecutor = AppDatabase | AppTransaction;
