import { Class, ClassId } from '@/domain/models';
import { IClassRepository } from '@/domain/repositories/i-class.repository';

export class GetClassByIdUseCase {
  constructor(private readonly classRepository: IClassRepository) {}

  async execute(id: ClassId): Promise<Class | null> {
    return this.classRepository.findById(id);
  }
}
