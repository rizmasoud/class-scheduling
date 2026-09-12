import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ISchedulingContextLoader } from '../application/i-scheduling-context-loader.port';
import { SchedulingContext, Book, Teacher, Student, AvailableDayPattern } from '@class-scheduling/domain';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PG_CONNECTION } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { eq, isNotNull } from 'drizzle-orm';

@Injectable()
export class SchedulingContextLoader implements ISchedulingContextLoader {
  constructor(
    @Inject(PG_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async loadContext(termId: string): Promise<SchedulingContext> {
    const term = await this.db.query.academicTerms.findFirst({
      where: eq(schema.academicTerms.id, termId),
    });
    if (!term) throw new NotFoundException('Academic term not found');

    const dbBooks = await this.db.select().from(schema.books);
    
    const dbTeachers = await this.db.select().from(schema.teachers);
    const dbTeacherSkills = await this.db.select().from(schema.teacherSkills);
    
    const dbStudents = await this.db.select().from(schema.students).where(isNotNull(schema.students.currentBookId));
    const dbStudentPreferences = await this.db.select().from(schema.studentPreferences);

    const activeBooks: Book[] = dbBooks.map(b => ({
      id: b.id,
      name: b.title,
      level: b.level ? parseInt(b.level, 10) || 1 : 1,
      sequenceOrder: b.sequenceOrder,
      sessionCount: b.sessionCount,
    }));

    const activeTeachers: Teacher[] = dbTeachers.map(t => {
      const skills = dbTeacherSkills.filter(s => s.teacherId === t.id).map(s => ({
        id: s.id,
        teacherId: s.teacherId,
        bookId: s.bookId
      }));
      return {
        id: t.id,
        fullName: t.fullName,
        notes: t.notes,
        skills,
        preference: null // We don't have teacher preferences in DB currently
      };
    });

    const activeStudents: Student[] = dbStudents.map(s => {
      const pref = dbStudentPreferences.find(p => p.studentId === s.id);
      return {
        id: s.id,
        fullName: s.fullName,
        currentBookId: s.currentBookId!,
        notes: null,
        preference: pref ? {
          id: pref.id,
          studentId: pref.studentId,
          availableDayPattern: pref.availableDayPattern as AvailableDayPattern,
          unavailableTimeRanges: pref.unavailableTimeRanges as string[] || [],
          notes: null
        } : null
      };
    });

    return {
      activeBooks,
      activeTeachers,
      activeStudents,
      activeClasses: [],
    };
  }
}
