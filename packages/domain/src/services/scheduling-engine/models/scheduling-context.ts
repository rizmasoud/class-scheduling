import { Teacher, Student, Book, Class } from '../../../models';

export interface SchedulingContext {
  readonly activeTeachers: readonly Teacher[];
  readonly activeStudents: readonly Student[];
  readonly activeBooks: readonly Book[];
  readonly activeClasses: readonly Class[];
}
