import { Teacher, TeacherId, TeacherPreferenceId, TeacherSkillId, BookId, AvailableDayPattern } from '@/domain/models';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';

export interface UpdateTeacherPreferenceDTO {
  unavailableDayPattern?: AvailableDayPattern | null;
  unavailableTimeRanges?: string[] | null;
  maxWeeklySessions?: number | null;
  notes?: string | null;
}

export interface UpdateTeacherSkillDTO {
  id?: TeacherSkillId;
  bookId: BookId;
}

export interface UpdateTeacherDTO {
  id: TeacherId;
  fullName?: string;
  notes?: string | null;
  preference?: UpdateTeacherPreferenceDTO | null;
  skills?: UpdateTeacherSkillDTO[] | null;
}

export class UpdateTeacherUseCase {
  constructor(private readonly teacherRepository: ITeacherRepository) {}

  async execute(dto: UpdateTeacherDTO): Promise<Teacher> {
    const existingTeacher = await this.teacherRepository.findById(dto.id);
    if (!existingTeacher) {
      throw new Error(`Teacher with id ${dto.id} not found`);
    }

    let updatedPreference = existingTeacher.preference;
    if (dto.preference === null) {
      updatedPreference = null;
    } else if (dto.preference) {
      if (existingTeacher.preference) {
        updatedPreference = {
          ...existingTeacher.preference,
          unavailableDayPattern: dto.preference.unavailableDayPattern !== undefined ? dto.preference.unavailableDayPattern : existingTeacher.preference.unavailableDayPattern,
          unavailableTimeRanges: dto.preference.unavailableTimeRanges !== undefined ? dto.preference.unavailableTimeRanges : existingTeacher.preference.unavailableTimeRanges,
          maxWeeklySessions: dto.preference.maxWeeklySessions !== undefined ? dto.preference.maxWeeklySessions : existingTeacher.preference.maxWeeklySessions,
          notes: dto.preference.notes !== undefined ? dto.preference.notes : existingTeacher.preference.notes,
        };
      } else {
        updatedPreference = {
          id: crypto.randomUUID() as TeacherPreferenceId,
          teacherId: dto.id,
          unavailableDayPattern: dto.preference.unavailableDayPattern ?? null,
          unavailableTimeRanges: dto.preference.unavailableTimeRanges ?? null,
          maxWeeklySessions: dto.preference.maxWeeklySessions ?? null,
          notes: dto.preference.notes ?? null,
        };
      }
    }

    let updatedSkills = existingTeacher.skills;
    if (dto.skills === null) {
      updatedSkills = [];
    } else if (dto.skills) {
      updatedSkills = dto.skills.map(skill => ({
        id: skill.id ?? (crypto.randomUUID() as TeacherSkillId),
        teacherId: dto.id,
        bookId: skill.bookId
      }));
    }

    const updatedTeacher: Teacher = {
      ...existingTeacher,
      fullName: dto.fullName ?? existingTeacher.fullName,
      notes: dto.notes !== undefined ? dto.notes : existingTeacher.notes,
      preference: updatedPreference,
      skills: updatedSkills,
    };

    return this.teacherRepository.save(updatedTeacher);
  }
}
