import { eq, inArray } from 'drizzle-orm';
import { SQLiteTable, SQLiteUpdateSetSource } from 'drizzle-orm/sqlite-core';
import { DbExecutor } from './src/core/database/types';

export abstract class BaseRepository<
  TTable extends SQLiteTable & { id: any },
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

  async findMany(ids: readonly string[]): Promise<readonly TEntity[]> {
    if (ids.length === 0) return [];
    
    const results = await this.db
      .select()
      .from(this.table)
      .where(inArray(this.table.id, [...ids]));
      
    return results as readonly TEntity[];
  }

  async findAll(): Promise<readonly TEntity[]> {
    const results = await this.db
      .select()
      .from(this.table);
      
    return results as readonly TEntity[];
  }

  async insert(entity: TInsert): Promise<TEntity> {
    const results = await this.db
      .insert(this.table)
      .values(entity as TTable['$inferInsert'])
      .returning();
      
    return results[0] as TEntity;
  }

  async update(id: string, entity: TInsert): Promise<TEntity> {
    const results = await this.db
      .update(this.table)
      .set(entity as SQLiteUpdateSetSource<TTable>)
      .where(eq(this.table.id, id))
      .returning();
      
    return results[0] as TEntity;
  }
}

export abstract class SoftDeleteRepository<
  TTable extends SQLiteTable & { id: any; isArchived: any; archivedAt: any },
  TEntity,
  TInsert
> extends BaseRepository<TTable, TEntity, TInsert> {
  async softDelete(id: string): Promise<void> {
    await this.db
      .update(this.table)
      .set({
        isArchived: true,
        archivedAt: new Date().toISOString(),
      } as SQLiteUpdateSetSource<TTable>)
      .where(eq(this.table.id, id));
  }
}
