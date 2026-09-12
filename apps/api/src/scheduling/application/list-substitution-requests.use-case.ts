import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, or, inArray } from 'drizzle-orm';
import * as schema from '../../infrastructure/database/schema';

@Injectable()
export class ListSubstitutionRequestsUseCase {
  constructor(
    @Inject('PG_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(
    userId: string,
    role: string,
    filters?: { sessionId?: string; status?: string },
  ) {
    if (role === 'Supervisor') {
      const conditions: any[] = [];
      if (filters?.sessionId) {
        conditions.push(eq(schema.substitutionRequests.sessionId, filters.sessionId));
      }
      if (filters?.status) {
        conditions.push(eq(schema.substitutionRequests.status, filters.status));
      }

      return await this.db.query.substitutionRequests.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: (sr, { desc }) => [desc(sr.createdAt)],
      });
    }

    if (role === 'Teacher') {
      const teacher = await this.db.query.teachers.findFirst({
        where: eq(schema.teachers.userId, userId),
      });

      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found');
      }

      // Teacher's skills
      const skills = await this.db.query.teacherSkills.findMany({
        where: eq(schema.teacherSkills.teacherId, teacher.id),
      });
      const eligibleBookIds = skills.map((s) => s.bookId);

      // Find all requests
      const allRequests = await this.db.query.substitutionRequests.findMany({
        orderBy: (sr, { desc }) => [desc(sr.createdAt)],
      });

      // Filter for teacher:
      // 1. Requested by this teacher's user
      // 2. Or accepted by / targeted to this teacher
      // 3. Or broadcast and teacher is qualified for the session's book
      const visibleRequests: any[] = [];
      for (const req of allRequests) {
        if (req.requestedBy === userId) {
          visibleRequests.push(req);
          continue;
        }
        if (req.acceptedById === teacher.id || req.requestedSubstituteId === teacher.id) {
          visibleRequests.push(req);
          continue;
        }
        if (req.status === 'Broadcast') {
          const session = await this.db.query.classSessions.findFirst({
            where: eq(schema.classSessions.id, req.sessionId),
          });
          if (session && session.scheduledTeacherId !== teacher.id) {
            const cls = await this.db.query.classes.findFirst({
              where: eq(schema.classes.id, session.classId),
            });
            if (cls && eligibleBookIds.includes(cls.bookId)) {
              visibleRequests.push(req);
            }
          }
        }
      }

      return visibleRequests;
    }

    throw new ForbiddenException('Unauthorized role');
  }
}
