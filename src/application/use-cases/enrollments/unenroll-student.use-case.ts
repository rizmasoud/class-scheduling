import { Class, ClassId, StudentId } from '@/domain/models';
import { unenrollStudent } from '@/domain/services/enrollment.logic';
import { IClassRepository } from '@/domain/repositories/i-class.repository';

export interface UnenrollStudentDTO {
  classId: ClassId;
  studentId: StudentId;
  date: string;
}

export class UnenrollStudentUseCase {
  constructor(private readonly classRepository: IClassRepository) {}

  async execute(dto: UnenrollStudentDTO): Promise<Class> {
    const clazz = await this.classRepository.findById(dto.classId);
    if (!clazz) {
      throw new Error(`Class with id ${dto.classId} not found`);
    }

    const updatedClass = unenrollStudent(clazz, dto.studentId, dto.date);
    return this.classRepository.save(updatedClass);
  }
}
