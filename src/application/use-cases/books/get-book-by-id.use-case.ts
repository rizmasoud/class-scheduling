import { Book, BookId } from '@/domain/models';
import { IBookRepository } from '@/domain/repositories/i-book.repository';

export class GetBookByIdUseCase {
  constructor(private readonly bookRepository: IBookRepository) {}

  async execute(id: BookId): Promise<Book | null> {
    return this.bookRepository.findById(id);
  }
}
