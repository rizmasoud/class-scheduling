import { Class, Student, EnrollmentId, StudentId } from '../models';

export function enrollStudent(clazz: Class, student: Student, enrollmentId: EnrollmentId, date: string): Class {
  const activeEnrollments = (clazz.enrollments || []).filter(e => e.enrollmentStatus === 'Active');
  
  if (activeEnrollments.some(e => e.studentId === student.id)) {
    throw new Error('Student is already enrolled in this class');
  }

  if (activeEnrollments.length >= clazz.maxCapacity) {
    throw new Error('Class has reached maximum capacity');
  }

  if (student.currentBookId !== clazz.bookId) {
    throw new Error('Student current book does not match class book');
  }

  const newEnrollment = {
    id: enrollmentId,
    classId: clazz.id,
    studentId: student.id,
    enrollmentStatus: 'Active' as const,
    joinedAt: date,
    leftAt: null
  };

  return {
    ...clazz,
    enrollments: [...(clazz.enrollments || []), newEnrollment]
  };
}

export function unenrollStudent(clazz: Class, studentId: StudentId, date: string): Class {
  const enrollments = clazz.enrollments || [];
  const activeEnrollmentIndex = enrollments.findIndex(e => e.studentId === studentId && e.enrollmentStatus === 'Active');

  if (activeEnrollmentIndex === -1) {
    throw new Error('Student is not actively enrolled in this class');
  }

  const updatedEnrollments = [...enrollments];
  updatedEnrollments[activeEnrollmentIndex] = {
    ...updatedEnrollments[activeEnrollmentIndex],
    enrollmentStatus: 'Dropped',
    leftAt: date
  };

  return {
    ...clazz,
    enrollments: updatedEnrollments
  };
}
