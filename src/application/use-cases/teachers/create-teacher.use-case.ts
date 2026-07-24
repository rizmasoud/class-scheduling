import { Teacher, TeacherId, TeacherPreferenceId, TeacherSkillId, BookId, AvailableDayPattern } from '@/domain/models';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';

export interface CreateTeacherPreferenceDTO {
  unavailableDayPattern?: AvailableDayPattern | null;
  unavailableTimeRanges?: string[] | null;
  maxWeeklySessions?: number | null;
  notes?: string | null;
}

export interface CreateTeacherSkillDTO {
  bookId: BookId;
}

export interface CreateTeacherDTO {
  fullName: string;
  notes?: string | null;
  preference?: CreateTeacherPreferenceDTO | null;
  skills?: CreateTeacherSkillDTO[] | null;
}

export class CreateTeacherUseCase {
  constructor(private readonly teacherRepository: ITeacherRepository) {}

  async execute(dto: CreateTeacherDTO): Promise<Teacher> {
    const teacherId = crypto.randomUUID() as TeacherId;
    
    const teacher: Teacher = {
      id: teacherId,
      fullName: dto.fullName,
      notes: dto.notes ?? null,
      preference: dto.preference ? {
        id: crypto.randomUUID() as TeacherPreferenceId,
        teacherId,
        unavailableDayPattern: dto.preference.unavailableDayPattern ?? null,
        unavailableTimeRanges: dto.preference.unavailableTimeRanges ?? null,
        maxWeeklySessions: dto.preference.maxWeeklySessions ?? null,
        notes: dto.preference.notes ?? null,
      } : null,
      skills: dto.skills ? dto.skills.map(skill => ({
        id: crypto.randomUUID() as TeacherSkillId,
        teacherId,
        bookId: skill.bookId
      })) : [],
    };
    
    return this.teacherRepository.save(teacher);
  }
}
