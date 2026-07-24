import { eq } from 'drizzle-orm';
import { DbExecutor } from '@/core/database/types';
import { books, Book as PersistenceBook, InsertBook } from '@/core/database/schema/books.schema';
import { Book, BookId } from '@/domain/models';
import { IBookRepository } from '@/domain/repositories/i-book.repository';
import { BookMapper } from '@/infrastructure/mappers/book.mapper';
import { SoftDeleteRepository } from './base.repository';

export class BookRepository
  extends SoftDeleteRepository<typeof books, PersistenceBook, InsertBook>
  implements IBookRepository
{
  constructor(db: DbExecutor) {
    super(db, books);
  }

  async findById(id: BookId): Promise<Book | null> {
    const raw = await super.executeFindById(id as string);
    if (!raw) return null;
    return BookMapper.toDomain(raw);
  }

  async findMany(ids: readonly BookId[]): Promise<readonly Book[]> {
    if (ids.length === 0) return [];
    const raw = await super.executeFindMany(ids as readonly string[]);
    return raw.map(BookMapper.toDomain);
  }

  async findAll(): Promise<readonly Book[]> {
    const raw = await super.executeFindAll();
    return raw.map(BookMapper.toDomain);
  }

  async findAllActive(): Promise<readonly Book[]> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.isArchived, false));
      
    return results.map(BookMapper.toDomain);
  }

  async save(book: Book): Promise<Book> {
    const persistenceModel = BookMapper.toPersistence(book);

    const existing = await super.executeFindById(book.id as string);

    let result: PersistenceBook;
    if (existing) {
      result = await super.executeUpdate(book.id as string, persistenceModel);
    } else {
      result = await super.executeInsert(persistenceModel);
    }

    return BookMapper.toDomain(result);
  }

  async archive(id: BookId): Promise<void> {
    await super.executeSoftDelete(id as string);
  }
}
