import { Student, StudentId, StudentPreferenceId, BookId, AvailableDayPattern } from '@/domain/models';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';

export interface CreateStudentPreferenceDTO {
  availableDayPattern: AvailableDayPattern;
  unavailableTimeRanges?: string[] | null;
  notes?: string | null;
}

export interface CreateStudentDTO {
  fullName: string;
  currentBookId: BookId;
  notes?: string | null;
  preference?: CreateStudentPreferenceDTO | null;
}

export class CreateStudentUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(dto: CreateStudentDTO): Promise<Student> {
    const studentId = crypto.randomUUID() as StudentId;
    const student: Student = {
      id: studentId,
      fullName: dto.fullName,
      currentBookId: dto.currentBookId,
      notes: dto.notes ?? null,
      preference: dto.preference ? {
        id: crypto.randomUUID() as StudentPreferenceId,
        studentId: studentId,
        availableDayPattern: dto.preference.availableDayPattern,
        unavailableTimeRanges: dto.preference.unavailableTimeRanges ?? null,
        notes: dto.preference.notes ?? null,
      } : null,
    };
    return this.studentRepository.save(student);
  }
}
