import { StudentId } from '@/domain/models';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';

export class ArchiveStudentUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(id: StudentId): Promise<void> {
    await this.studentRepository.archive(id);
  }
}
