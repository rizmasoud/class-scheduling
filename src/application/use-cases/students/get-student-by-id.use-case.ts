import { Student, StudentId } from '@/domain/models';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';

export class GetStudentByIdUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(id: StudentId): Promise<Student | null> {
    return this.studentRepository.findById(id);
  }
}
