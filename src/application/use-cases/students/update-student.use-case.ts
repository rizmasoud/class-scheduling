import { Student, StudentId, StudentPreferenceId, BookId, AvailableDayPattern } from '@/domain/models';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';

export interface UpdateStudentPreferenceDTO {
  availableDayPattern?: AvailableDayPattern;
  unavailableTimeRanges?: string[] | null;
  notes?: string | null;
}

export interface UpdateStudentDTO {
  id: StudentId;
  fullName?: string;
  currentBookId?: BookId;
  notes?: string | null;
  preference?: UpdateStudentPreferenceDTO | null;
}

export class UpdateStudentUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(dto: UpdateStudentDTO): Promise<Student> {
    const existingStudent = await this.studentRepository.findById(dto.id);
    if (!existingStudent) {
      throw new Error(`Student with id ${dto.id} not found`);
    }

    let updatedPreference = existingStudent.preference;
    if (dto.preference === null) {
      updatedPreference = null;
    } else if (dto.preference) {
      if (existingStudent.preference) {
        updatedPreference = {
          ...existingStudent.preference,
          availableDayPattern: dto.preference.availableDayPattern ?? existingStudent.preference.availableDayPattern,
          unavailableTimeRanges: dto.preference.unavailableTimeRanges !== undefined ? dto.preference.unavailableTimeRanges : existingStudent.preference.unavailableTimeRanges,
          notes: dto.preference.notes !== undefined ? dto.preference.notes : existingStudent.preference.notes,
        };
      } else {
        if (!dto.preference.availableDayPattern) {
           throw new Error('availableDayPattern is required when creating a new preference');
        }
        updatedPreference = {
          id: crypto.randomUUID() as StudentPreferenceId,
          studentId: dto.id,
          availableDayPattern: dto.preference.availableDayPattern,
          unavailableTimeRanges: dto.preference.unavailableTimeRanges ?? null,
          notes: dto.preference.notes ?? null,
        };
      }
    }

    const updatedStudent: Student = {
      ...existingStudent,
      fullName: dto.fullName ?? existingStudent.fullName,
      currentBookId: dto.currentBookId ?? existingStudent.currentBookId,
      notes: dto.notes !== undefined ? dto.notes : existingStudent.notes,
      preference: updatedPreference,
    };

    return this.studentRepository.save(updatedStudent);
  }
}
