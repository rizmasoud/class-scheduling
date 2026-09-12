import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PG_CONNECTION } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { eq, or, and } from 'drizzle-orm';

@Injectable()
export class ListClassSessionsUseCase {
  constructor(
    @Inject(PG_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(userRole: string, teacherId?: string, classId?: string) {
    let whereCondition = undefined;
    const conditions = [];

    if (userRole === 'Teacher') {
      if (!teacherId) return [];
      conditions.push(or(
        eq(schema.classSessions.scheduledTeacherId, teacherId),
        eq(schema.classSessions.actualTeacherId, teacherId)
      ));
    }

    if (classId) {
      conditions.push(eq(schema.classSessions.classId, classId));
    }

    if (conditions.length > 0) {
      whereCondition = and(...conditions);
    }

    const sessions = await this.db.query.classSessions.findMany({
      where: whereCondition,
      orderBy: (s, { asc }) => [asc(s.date), asc(s.startTime)],
    });

    return sessions;
  }
}
