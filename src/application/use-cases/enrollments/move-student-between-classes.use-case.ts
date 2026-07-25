import { Class, ClassId, StudentId, EnrollmentId } from '@/domain/models';
import { enrollStudent, unenrollStudent } from '@/domain/services/enrollment.logic';
import { IClassRepository } from '@/domain/repositories/i-class.repository';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';

export interface MoveStudentBetweenClassesDTO {
  studentId: StudentId;
  oldClassId: ClassId;
  newClassId: ClassId;
  date: string;
}

export class MoveStudentBetweenClassesUseCase {
  constructor(
    private readonly classRepository: IClassRepository,
    private readonly studentRepository: IStudentRepository
  ) {}

  async execute(dto: MoveStudentBetweenClassesDTO): Promise<{ oldClass: Class; newClass: Class }> {
    const oldClass = await this.classRepository.findById(dto.oldClassId);
    if (!oldClass) {
      throw new Error(`Old class with id ${dto.oldClassId} not found`);
    }

    const newClass = await this.classRepository.findById(dto.newClassId);
    if (!newClass) {
      throw new Error(`New class with id ${dto.newClassId} not found`);
    }

    const student = await this.studentRepository.findById(dto.studentId);
    if (!student) {
      throw new Error(`Student with id ${dto.studentId} not found`);
    }

    const updatedOldClass = unenrollStudent(oldClass, dto.studentId, dto.date);
    const enrollmentId = crypto.randomUUID() as EnrollmentId;
    const updatedNewClass = enrollStudent(newClass, student, enrollmentId, dto.date);

    const [savedOldClass, savedNewClass] = await this.classRepository.saveMany([updatedOldClass, updatedNewClass]);

    return {
      oldClass: savedOldClass,
      newClass: savedNewClass
    };
  }
}
