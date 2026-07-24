import { ClassId } from '@/domain/models';
import { IClassRepository } from '@/domain/repositories/i-class.repository';

export class ArchiveClassUseCase {
  constructor(private readonly classRepository: IClassRepository) {}

  async execute(id: ClassId): Promise<void> {
    await this.classRepository.archive(id);
  }
}
