import { Teacher } from '@/domain/models';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';

export class GetActiveTeachersUseCase {
  constructor(private readonly teacherRepository: ITeacherRepository) {}

  async execute(): Promise<readonly Teacher[]> {
    return this.teacherRepository.findAllActive();
  }
}
