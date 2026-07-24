import { 
  Teacher as DomainTeacher, 
  TeacherPreference as DomainTeacherPreference,
  TeacherSkill as DomainTeacherSkill,
  TeacherId,
  TeacherPreferenceId,
  TeacherSkillId,
  BookId,
  AvailableDayPattern as DomainAvailableDayPattern
} from '@/domain/models';
import { Teacher as PersistenceTeacher, InsertTeacher } from '@/core/database/schema/teachers.schema';
import { TeacherPreference as PersistenceTeacherPreference, InsertTeacherPreference } from '@/core/database/schema/teacher-preferences.schema';
import { TeacherSkill as PersistenceTeacherSkill, InsertTeacherSkill } from '@/core/database/schema/teacher-skills.schema';
import { AvailableDayPattern as PersistenceAvailableDayPattern } from '@/core/database/schema/enums';

export const TeacherMapper = {
  toDomain(raw: PersistenceTeacher): DomainTeacher {
    return {
      id: raw.id as TeacherId,
      fullName: raw.fullName,
      notes: raw.notes,
    };
  },
  
  toPersistence(domain: DomainTeacher): InsertTeacher {
    return {
      id: domain.id as string,
      fullName: domain.fullName,
      notes: domain.notes,
    };
  },

  toDomainPreference(raw: PersistenceTeacherPreference): DomainTeacherPreference {
    return {
      id: raw.id as TeacherPreferenceId,
      teacherId: raw.teacherId as TeacherId,
      unavailableDayPattern: raw.unavailableDayPattern as DomainAvailableDayPattern | null,
      unavailableTimeRanges: Array.isArray(raw.unavailableTimeRanges) 
        ? (raw.unavailableTimeRanges as string[]) 
        : null,
      maxWeeklySessions: raw.maxWeeklySessions,
      notes: raw.notes,
    };
  },

  toPersistencePreference(domain: DomainTeacherPreference): InsertTeacherPreference {
    return {
      id: domain.id as string,
      teacherId: domain.teacherId as string,
      unavailableDayPattern: domain.unavailableDayPattern as PersistenceAvailableDayPattern | null,
      unavailableTimeRanges: domain.unavailableTimeRanges,
      maxWeeklySessions: domain.maxWeeklySessions,
      notes: domain.notes,
    };
  },

  toDomainSkill(raw: PersistenceTeacherSkill): DomainTeacherSkill {
    return {
      id: raw.id as TeacherSkillId,
      teacherId: raw.teacherId as TeacherId,
      bookId: raw.bookId as BookId,
    };
  },

  toPersistenceSkill(domain: DomainTeacherSkill): InsertTeacherSkill {
    return {
      id: domain.id as string,
      teacherId: domain.teacherId as string,
      bookId: domain.bookId as string,
    };
  }
};
