import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PG_CONNECTION } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { eq, or } from 'drizzle-orm';

@Injectable()
export class GetClassUseCase {
  constructor(
    @Inject(PG_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(classId: string, userRole: string, teacherId?: string) {
    const cls = await this.db.query.classes.findFirst({
      where: eq(schema.classes.id, classId)
    });

    if (!cls) {
      throw new NotFoundException('Class not found');
    }

    if (userRole === 'Teacher' && cls.teacherId !== teacherId) {
      throw new NotFoundException('Class not found'); // Hide unauthorized classes by acting as if they don't exist
    }

    const schedules = await this.db.query.classSchedules.findMany({
      where: eq(schema.classSchedules.classId, classId)
    });

    const sessions = await this.db.query.classSessions.findMany({
      where: eq(schema.classSessions.classId, classId)
    });

    const students = await this.db.query.classStudents.findMany({
      where: eq(schema.classStudents.classId, classId)
    });

    return {
      ...cls,
      schedules,
      sessions,
      studentIds: students.map(s => s.studentId),
    };
  }
}
