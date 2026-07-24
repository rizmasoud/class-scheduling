import { Class } from '@/domain/models';
import { IClassRepository } from '@/domain/repositories/i-class.repository';

export class GetActiveClassesUseCase {
  constructor(private readonly classRepository: IClassRepository) {}

  async execute(): Promise<readonly Class[]> {
    return this.classRepository.findAllActive();
  }
}
