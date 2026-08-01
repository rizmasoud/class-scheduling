import { Book } from '@/domain/models';
import { IBookRepository } from '@/domain/repositories/i-book.repository';

export class GetActiveBooksUseCase {
  constructor(private readonly bookRepository: IBookRepository) {}

  async execute(): Promise<readonly Book[]> {
    console.log("[5] GetActiveBooksUseCase.execute() called");
    console.log("GetActiveBooksUseCase.execute() called");
    const result = await this.bookRepository.findAllActive();
    console.log("GetActiveBooksUseCase.execute() returning:", result);
    return result;
  }
}
