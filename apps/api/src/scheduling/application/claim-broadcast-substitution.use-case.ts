import { Injectable, Inject, ForbiddenException, ConflictException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../infrastructure/database/schema';

@Injectable()
export class ClaimBroadcastSubstitutionUseCase {
  constructor(
    @Inject('PG_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(requestId: string, teacherUserId: string) {
    return await this.db.transaction(async (tx) => {
      const teacher = await tx.query.teachers.findFirst({
        where: eq(schema.teachers.userId, teacherUserId),
      });

      if (!teacher) throw new ForbiddenException('Teacher profile not found');

      const [req] = await tx
        .select()
        .from(schema.substitutionRequests)
        .where(eq(schema.substitutionRequests.id, requestId))
        .for('update');

      if (!req) throw new ConflictException('Request not found');

      if (req.status !== 'Broadcast') {
        throw new ConflictException('This request is no longer available for broadcast claim');
      }

      const session = await tx.query.classSessions.findFirst({
        where: eq(schema.classSessions.id, req.sessionId),
      });

      if (!session) throw new ConflictException('Session not found');

      const cls = await tx.query.classes.findFirst({
        where: eq(schema.classes.id, session.classId),
      });

      if (session.scheduledTeacherId === teacher.id) {
         throw new ConflictException('Cannot claim your own session');
      }

      const skills = await tx.query.teacherSkills.findFirst({
        where: and(eq(schema.teacherSkills.teacherId, teacher.id), eq(schema.teacherSkills.bookId, cls!.bookId)),
      });

      if (!skills) {
        throw new ConflictException('You are not eligible to teach this book');
      }

      const [updated] = await tx.update(schema.substitutionRequests)
        .set({ status: 'Accepted', acceptedById: teacher.id, updatedAt: new Date() })
        .where(eq(schema.substitutionRequests.id, requestId))
        .returning();

      await tx.insert(schema.auditLogs).values({
        tableName: 'substitution_requests',
        recordId: requestId,
        action: 'CLAIM_BROADCAST',
        changedBy: teacherUserId,
        oldData: { status: 'Broadcast', acceptedById: null },
        newData: { status: 'Accepted', acceptedById: teacher.id },
      });

      return updated;
    });
  }
}
