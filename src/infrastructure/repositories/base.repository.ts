import { eq, inArray } from 'drizzle-orm';
import { SQLiteTable, SQLiteUpdateSetSource } from 'drizzle-orm/sqlite-core';
import { DbExecutor } from '@/core/database/types';

/**
 * BaseRepository
 * 
 * Provides reusable primitive persistence operations for a single Drizzle table.
 * It is completely unaware of Domain models, Aggregates, Mappers, or business rules.
 * 
 * Generic Parameters:
 * - TTable: The Drizzle table object type. Must contain an id column.
 * - TEntity: The Drizzle schema select type (e.g., typeof table.$inferSelect).
 * - TInsert: The Drizzle schema insert type (e.g., typeof table.$inferInsert).
 */
export abstract class BaseRepository<
  TTable extends SQLiteTable & { id: any },
  TEntity,
  TInsert
> {
  constructor(
    protected readonly db: DbExecutor,
    protected readonly table: TTable
  ) {}

  /**
   * Finds a single entity by its primary key ID.
   */
  protected async executeFindById(id: string): Promise<TEntity | null> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    
    return (results[0] as TEntity) || null;
  }

  /**
   * Finds multiple entities by their primary key IDs.
   */
  protected async executeFindMany(ids: readonly string[]): Promise<readonly TEntity[]> {
    if (ids.length === 0) return [];
    
    const results = await this.db
      .select()
      .from(this.table)
      .where(inArray(this.table.id, [...ids]));
      
    return results as readonly TEntity[];
  }

  /**
   * Retrieves all entities in the table without applying any filters.
   * Concrete repositories are responsible for applying 'active' filtering if needed.
   */
  protected async executeFindAll(): Promise<readonly TEntity[]> {
    const results = await this.db
      .select()
      .from(this.table);
      
    return results as readonly TEntity[];
  }

  /**
   * Inserts a new entity into the database.
   * Relies on the concrete repository to orchestrate insertion workflows.
   */
  protected async executeInsert(entity: TInsert): Promise<TEntity> {
    const results = await this.db
      .insert(this.table)
      .values(entity as TTable['$inferInsert'])
      .returning();
      
    return results[0] as TEntity;
  }

  /**
   * Updates an existing entity completely.
   * Accepts a complete persistence model (no Partial updates).
   */
  protected async executeUpdate(id: string, entity: TInsert): Promise<TEntity> {
    const results = await this.db
      .update(this.table)
      .set(entity as SQLiteUpdateSetSource<TTable>)
      .where(eq(this.table.id, id))
      .returning();
      
    return results[0] as TEntity;
  }
}

/**
 * SoftDeleteRepository
 * 
 * Extends BaseRepository to add soft deletion capabilities.
 * Intended only for tables that support soft deletes (isArchived, archivedAt).
 */
export abstract class SoftDeleteRepository<
  TTable extends SQLiteTable & { id: any; isArchived: any; archivedAt: any },
  TEntity,
  TInsert
> extends BaseRepository<TTable, TEntity, TInsert> {
  
  /**
   * Performs a soft delete operation.
   * Translates the domain's archive concept into persistence state (isArchived).
   */
  protected async executeSoftDelete(id: string): Promise<void> {
    await this.db
      .update(this.table)
      .set({
        isArchived: true,
        archivedAt: new Date().toISOString(),
      } as SQLiteUpdateSetSource<TTable>)
      .where(eq(this.table.id, id));
  }
}
