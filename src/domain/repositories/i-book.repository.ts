import { Book, BookId } from '@/domain/models';

export interface IBookRepository {
  findById(id: BookId): Promise<Book | null>;
  findAll(): Promise<readonly Book[]>;
  findAllActive(): Promise<readonly Book[]>;
  findMany(ids: readonly BookId[]): Promise<readonly Book[]>;
  save(book: Book): Promise<Book>;
  archive(id: BookId): Promise<void>;
}
