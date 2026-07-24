import { 
  Student as DomainStudent, 
  StudentPreference as DomainStudentPreference,
  StudentId,
  StudentPreferenceId,
  BookId,
  AvailableDayPattern as DomainAvailableDayPattern
} from '@/domain/models';
import { Student as PersistenceStudent, InsertStudent } from '@/core/database/schema/students.schema';
import { StudentPreference as PersistenceStudentPreference, InsertStudentPreference } from '@/core/database/schema/student-preferences.schema';
import { AvailableDayPattern as PersistenceAvailableDayPattern } from '@/core/database/schema/enums';

export const StudentMapper = {
  toDomain(raw: PersistenceStudent): DomainStudent {
    return {
      id: raw.id as StudentId,
      fullName: raw.fullName,
      currentBookId: raw.currentBookId as BookId,
      notes: raw.notes,
    };
  },
  
  toPersistence(domain: DomainStudent): InsertStudent {
    return {
      id: domain.id as string,
      fullName: domain.fullName,
      currentBookId: domain.currentBookId as string,
      notes: domain.notes,
    };
  },

  toDomainPreference(raw: PersistenceStudentPreference): DomainStudentPreference {
    return {
      id: raw.id as StudentPreferenceId,
      studentId: raw.studentId as StudentId,
      availableDayPattern: raw.availableDayPattern as DomainAvailableDayPattern,
      unavailableTimeRanges: Array.isArray(raw.unavailableTimeRanges) 
        ? (raw.unavailableTimeRanges as string[]) 
        : null,
      notes: raw.notes,
    };
  },

  toPersistencePreference(domain: DomainStudentPreference): InsertStudentPreference {
    return {
      id: domain.id as string,
      studentId: domain.studentId as string,
      availableDayPattern: domain.availableDayPattern as PersistenceAvailableDayPattern,
      unavailableTimeRanges: domain.unavailableTimeRanges,
      notes: domain.notes,
    };
  }
};
