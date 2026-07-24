import { Book, BookId } from '@/domain/models';
import { IBookRepository } from '@/domain/repositories/i-book.repository';

export interface UpdateBookDTO {
  id: BookId;
  name?: string;
  level?: number;
  sequenceOrder?: number;
  sessionCount?: number;
}

export class UpdateBookUseCase {
  constructor(private readonly bookRepository: IBookRepository) {}

  async execute(dto: UpdateBookDTO): Promise<Book> {
    const existingBook = await this.bookRepository.findById(dto.id);
    if (!existingBook) {
      throw new Error(`Book with id ${dto.id} not found`);
    }

    const updatedBook: Book = {
      ...existingBook,
      name: dto.name ?? existingBook.name,
      level: dto.level ?? existingBook.level,
      sequenceOrder: dto.sequenceOrder ?? existingBook.sequenceOrder,
      sessionCount: dto.sessionCount ?? existingBook.sessionCount,
    };

    return this.bookRepository.save(updatedBook);
  }
}
