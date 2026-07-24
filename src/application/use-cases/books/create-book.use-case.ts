import { Book, BookId } from '@/domain/models';
import { IBookRepository } from '@/domain/repositories/i-book.repository';

export interface CreateBookDTO {
  name: string;
  level: number;
  sequenceOrder: number;
  sessionCount: number;
}

export class CreateBookUseCase {
  constructor(private readonly bookRepository: IBookRepository) {}

  async execute(dto: CreateBookDTO): Promise<Book> {
    const book: Book = {
      id: crypto.randomUUID() as BookId,
      name: dto.name,
      level: dto.level,
      sequenceOrder: dto.sequenceOrder,
      sessionCount: dto.sessionCount,
    };
    return this.bookRepository.save(book);
  }
}
