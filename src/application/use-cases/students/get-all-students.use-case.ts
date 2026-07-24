import { Student } from '@/domain/models';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';

export class GetAllStudentsUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(): Promise<readonly Student[]> {
    return this.studentRepository.findAll();
  }
}
