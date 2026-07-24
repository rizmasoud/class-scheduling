import { initializeDrizzle } from './src/core/database/drizzle';
type DB = ReturnType<typeof initializeDrizzle>;
type TX = Parameters<Parameters<DB['transaction']>[0]>[0];
