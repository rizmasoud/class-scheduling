import { Class, ClassId, StudentId, EnrollmentId } from '@/domain/models';
import { enrollStudent } from '@/domain/services/enrollment.logic';
import { IClassRepository } from '@/domain/repositories/i-class.repository';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';

export interface EnrollStudentDTO {
  classId: ClassId;
  studentId: StudentId;
  date: string;
}

export class EnrollStudentUseCase {
  constructor(
    private readonly classRepository: IClassRepository,
    private readonly studentRepository: IStudentRepository
  ) {}

  async execute(dto: EnrollStudentDTO): Promise<Class> {
    const clazz = await this.classRepository.findById(dto.classId);
    if (!clazz) {
      throw new Error(`Class with id ${dto.classId} not found`);
    }

    const student = await this.studentRepository.findById(dto.studentId);
    if (!student) {
      throw new Error(`Student with id ${dto.studentId} not found`);
    }

    const enrollmentId = crypto.randomUUID() as EnrollmentId;
    const updatedClass = enrollStudent(clazz, student, enrollmentId, dto.date);
    return this.classRepository.save(updatedClass);
  }
}
