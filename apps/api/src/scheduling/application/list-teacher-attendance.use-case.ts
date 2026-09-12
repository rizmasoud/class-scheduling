import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../infrastructure/database/schema';

@Injectable()
export class ListTeacherAttendanceUseCase {
  constructor(
    @Inject('PG_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(
    userId: string,
    role: string,
    filters?: { sessionId?: string; teacherId?: string },
  ) {
    if (role === 'Supervisor') {
      const conditions: any[] = [];
      if (filters?.sessionId) {
        conditions.push(eq(schema.teacherAttendances.sessionId, filters.sessionId));
      }
      if (filters?.teacherId) {
        conditions.push(eq(schema.teacherAttendances.teacherId, filters.teacherId));
      }

      return await this.db.query.teacherAttendances.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: (ta, { desc }) => [desc(ta.submittedAt)],
      });
    }

    if (role === 'Teacher') {
      const teacher = await this.db.query.teachers.findFirst({
        where: eq(schema.teachers.userId, userId),
      });

      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found');
      }

      const conditions = [eq(schema.teacherAttendances.teacherId, teacher.id)];
      if (filters?.sessionId) {
        conditions.push(eq(schema.teacherAttendances.sessionId, filters.sessionId));
      }

      return await this.db.query.teacherAttendances.findMany({
        where: and(...conditions),
        orderBy: (ta, { desc }) => [desc(ta.submittedAt)],
      });
    }

    throw new ForbiddenException('Unauthorized role');
  }
}
