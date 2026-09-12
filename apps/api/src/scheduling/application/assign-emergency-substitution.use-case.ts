import { Injectable, Inject, ConflictException, ForbiddenException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../infrastructure/database/schema';

@Injectable()
export class AssignEmergencySubstitutionUseCase {
  constructor(
    @Inject('PG_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(
    sessionId: string,
    substituteTeacherId: string,
    supervisorUserId: string,
    reason?: string,
  ) {
    return await this.db.transaction(async (tx) => {
      // 1. Lock and fetch session
      const [session] = await tx
        .select()
        .from(schema.classSessions)
        .where(eq(schema.classSessions.id, sessionId))
        .for('update');

      if (!session) {
        throw new ConflictException('Session not found');
      }

      const cls = await tx.query.classes.findFirst({
        where: eq(schema.classes.id, session.classId),
      });

      if (!cls) {
        throw new ConflictException('Class not found');
      }

      if (cls.classType !== 'Regular') {
        throw new ConflictException('Substitutions are only allowed for Regular classes');
      }

      // 2. Validate substitute teacher qualifications
      const substituteTeacher = await tx.query.teachers.findFirst({
        where: eq(schema.teachers.id, substituteTeacherId),
      });

      if (!substituteTeacher) {
        throw new ConflictException('Substitute teacher not found');
      }

      if (substituteTeacher.id === session.scheduledTeacherId) {
        throw new ConflictException('Cannot assign the scheduled teacher as their own substitute');
      }

      const skill = await tx.query.teacherSkills.findFirst({
        where: and(
          eq(schema.teacherSkills.teacherId, substituteTeacherId),
          eq(schema.teacherSkills.bookId, cls.bookId),
        ),
      });

      if (!skill) {
        throw new ConflictException('The substitute teacher is not eligible to teach this book');
      }

      // 3. If any active substitution request exists for this session, cancel it to avoid conflict
      const activeRequests = await tx
        .select()
        .from(schema.substitutionRequests)
        .where(eq(schema.substitutionRequests.sessionId, sessionId));

      for (const req of activeRequests) {
        if (['Pending', 'Broadcast', 'Accepted'].includes(req.status)) {
          await tx
            .update(schema.substitutionRequests)
            .set({ status: 'Cancelled', updatedAt: new Date() })
            .where(eq(schema.substitutionRequests.id, req.id));

          await tx.insert(schema.auditLogs).values({
            tableName: 'substitution_requests',
            recordId: req.id,
            action: 'CANCEL_SUPERSEDED_SUBSTITUTION',
            changedBy: supervisorUserId,
            oldData: { status: req.status },
            newData: { status: 'Cancelled' },
          });
        }
      }

      // 4. Create approved emergency substitution request
      const [subReq] = await tx
        .insert(schema.substitutionRequests)
        .values({
          sessionId,
          requestedBy: supervisorUserId,
          requestedSubstituteId: substituteTeacherId,
          acceptedById: substituteTeacherId,
          status: 'Approved',
          reason: reason || 'Supervisor Emergency Assignment',
        })
        .returning();

      // 5. Update session actualTeacherId, preserving scheduledTeacherId
      const oldActualTeacherId = session.actualTeacherId;
      await tx
        .update(schema.classSessions)
        .set({ actualTeacherId: substituteTeacherId })
        .where(eq(schema.classSessions.id, sessionId));

      // 6. Audit logs
      await tx.insert(schema.auditLogs).values({
        tableName: 'substitution_requests',
        recordId: subReq.id,
        action: 'EMERGENCY_SUBSTITUTION_ASSIGNMENT',
        changedBy: supervisorUserId,
        oldData: null,
        newData: subReq,
      });

      await tx.insert(schema.auditLogs).values({
        tableName: 'class_sessions',
        recordId: sessionId,
        action: 'UPDATE_SESSION_ACTUAL_TEACHER',
        changedBy: supervisorUserId,
        oldData: { actualTeacherId: oldActualTeacherId },
        newData: { actualTeacherId: substituteTeacherId },
      });

      return subReq;
    });
  }
}
