import { inArray, eq } from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { DbExecutor } from './src/core/database/types';
import { books } from './src/core/database/schema/books.schema';

export abstract class BaseRepository<
  TTable extends SQLiteTable & { 
    id: any; 
    isArchived: any; 
    archivedAt: any; 
  },
  TEntity,
  TInsert
> {
  constructor(
    protected readonly db: DbExecutor,
    protected readonly table: TTable
  ) {}

  async findById(id: string): Promise<TEntity | null> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    
    return (results[0] as TEntity) || null;
  }
}
