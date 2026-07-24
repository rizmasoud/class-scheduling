import { Teacher, TeacherId } from '@/domain/models';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';

export class GetTeacherByIdUseCase {
  constructor(private readonly teacherRepository: ITeacherRepository) {}

  async execute(id: TeacherId): Promise<Teacher | null> {
    return this.teacherRepository.findById(id);
  }
}
