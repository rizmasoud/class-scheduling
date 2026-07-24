import { BookId } from '@/domain/models';
import { IBookRepository } from '@/domain/repositories/i-book.repository';

export class ArchiveBookUseCase {
  constructor(private readonly bookRepository: IBookRepository) {}

  async execute(id: BookId): Promise<void> {
    await this.bookRepository.archive(id);
  }
}
