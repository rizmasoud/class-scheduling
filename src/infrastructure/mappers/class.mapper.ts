import { 
  Class as DomainClass, 
  ClassSchedule as DomainClassSchedule,
  Enrollment as DomainEnrollment,
  ClassId,
  BookId,
  TeacherId,
  ClassStatus as DomainClassStatus,
  ClassScheduleId,
  WeekDay as DomainWeekDay,
  EnrollmentId,
  StudentId,
  EnrollmentStatus as DomainEnrollmentStatus
} from '@/domain/models';
import { Class as PersistenceClass, InsertClass } from '@/core/database/schema/classes.schema';
import { ClassSchedule as PersistenceClassSchedule, InsertClassSchedule } from '@/core/database/schema/class-schedules.schema';
import { ClassStudent as PersistenceClassStudent, InsertClassStudent } from '@/core/database/schema/class-students.schema';
import { ClassStatus as PersistenceClassStatus, WeekDay as PersistenceWeekDay, EnrollmentStatus as PersistenceEnrollmentStatus } from '@/core/database/schema/enums';

export const ClassMapper = {
  toDomain(raw: PersistenceClass, schedules?: PersistenceClassSchedule[], enrollments?: PersistenceClassStudent[]): DomainClass {
    const scheds = schedules ? schedules.map(ClassMapper.toDomainSchedule) : undefined;
    const enrs = enrollments ? enrollments.map(ClassMapper.toDomainEnrollment) : undefined;
    return {
      id: raw.id as ClassId,
      name: raw.name,
      bookId: raw.bookId as BookId,
      teacherId: raw.teacherId as TeacherId | null,
      status: raw.status as DomainClassStatus,
      minCapacity: raw.minCapacity,
      targetCapacity: raw.targetCapacity,
      maxCapacity: raw.maxCapacity,
      notes: raw.notes,
      schedules: scheds,
      enrollments: enrs,
    };
  },
  
  toPersistence(domain: DomainClass): InsertClass {
    return {
      id: domain.id as string,
      name: domain.name,
      bookId: domain.bookId as string,
      teacherId: domain.teacherId as string | null,
      status: domain.status as PersistenceClassStatus,
      minCapacity: domain.minCapacity,
      targetCapacity: domain.targetCapacity,
      maxCapacity: domain.maxCapacity,
      notes: domain.notes,
    };
  },

  toDomainSchedule(raw: PersistenceClassSchedule): DomainClassSchedule {
    return {
      id: raw.id as ClassScheduleId,
      classId: raw.classId as ClassId,
      weekDay: raw.weekDay as DomainWeekDay,
      startTime: raw.startTime,
      endTime: raw.endTime,
    };
  },

  toPersistenceSchedule(domain: DomainClassSchedule): InsertClassSchedule {
    return {
      id: domain.id as string,
      classId: domain.classId as string,
      weekDay: domain.weekDay as PersistenceWeekDay,
      startTime: domain.startTime,
      endTime: domain.endTime,
    };
  },

  toDomainEnrollment(raw: PersistenceClassStudent): DomainEnrollment {
    return {
      id: raw.id as EnrollmentId,
      classId: raw.classId as ClassId,
      studentId: raw.studentId as StudentId,
      enrollmentStatus: raw.enrollmentStatus as DomainEnrollmentStatus,
      joinedAt: raw.joinedAt,
      leftAt: raw.leftAt,
    };
  },

  toPersistenceEnrollment(domain: DomainEnrollment): InsertClassStudent {
    return {
      id: domain.id as string,
      classId: domain.classId as string,
      studentId: domain.studentId as string,
      enrollmentStatus: domain.enrollmentStatus as PersistenceEnrollmentStatus,
      joinedAt: domain.joinedAt,
      leftAt: domain.leftAt,
    };
  }
};
