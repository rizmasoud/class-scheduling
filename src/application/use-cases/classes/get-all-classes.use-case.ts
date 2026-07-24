import { Class } from '@/domain/models';
import { IClassRepository } from '@/domain/repositories/i-class.repository';

export class GetAllClassesUseCase {
  constructor(private readonly classRepository: IClassRepository) {}

  async execute(): Promise<readonly Class[]> {
    return this.classRepository.findAll();
  }
}
