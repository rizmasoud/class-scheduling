import { Book } from '@/domain/models';
import { IBookRepository } from '@/domain/repositories/i-book.repository';

export class GetAllBooksUseCase {
  constructor(private readonly bookRepository: IBookRepository) {}

  async execute(): Promise<readonly Book[]> {
    return this.bookRepository.findAll();
  }
}
