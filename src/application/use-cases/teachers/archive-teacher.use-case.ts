import { TeacherId } from '@/domain/models';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';

export class ArchiveTeacherUseCase {
  constructor(private readonly teacherRepository: ITeacherRepository) {}

  async execute(id: TeacherId): Promise<void> {
    await this.teacherRepository.archive(id);
  }
}
