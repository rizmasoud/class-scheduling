import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const PG_CONNECTION = 'PG_CONNECTION';

export const dbProvider = {
  provide: PG_CONNECTION,
  useFactory: () => {
    // Determine the connection string based on environment (e.g. tests vs prod)
    const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/class_scheduling';
    const pool = new Pool({
      connectionString,
    });
    return drizzle(pool, { schema });
  },
};

@Global()
@Module({
  providers: [dbProvider],
  exports: [PG_CONNECTION],
})
export class DatabaseModule {}
