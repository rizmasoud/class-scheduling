import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, ne } from 'drizzle-orm';
import * as schema from '../../infrastructure/database/schema';

export interface EligibleSubstituteDTO {
  id: string;
  fullName: string;
}

@Injectable()
export class GetEligibleSubstitutesUseCase {
  constructor(
    @Inject('PG_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(sessionId: string): Promise<EligibleSubstituteDTO[]> {
    const session = await this.db.query.classSessions.findFirst({
      where: eq(schema.classSessions.id, sessionId),
    });

    if (!session) {
      throw new ConflictException('Session not found');
    }

    const cls = await this.db.query.classes.findFirst({
      where: eq(schema.classes.id, session.classId),
    });

    if (!cls) {
      throw new ConflictException('Class not found');
    }

    // Find all teachers who have the skill for this class's book, excluding the scheduled teacher
    const qualifiedSkills = await this.db.query.teacherSkills.findMany({
      where: eq(schema.teacherSkills.bookId, cls.bookId),
    });

    const teacherIds = qualifiedSkills
      .map((s) => s.teacherId)
      .filter((id) => id !== session.scheduledTeacherId);

    if (teacherIds.length === 0) {
      return [];
    }

    const eligibleTeachers = await this.db.query.teachers.findMany({
      where: (t, { inArray }) => inArray(t.id, teacherIds),
    });

    return eligibleTeachers.map((t) => ({
      id: t.id,
      fullName: t.fullName,
    }));
  }
}
