import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../../infrastructure/database/schema';

@Injectable()
export class ApproveSubstitutionUseCase {
  constructor(
    @Inject('PG_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(requestId: string, supervisorUserId: string, approved: boolean) {
    return await this.db.transaction(async (tx) => {
      const [req] = await tx
        .select()
        .from(schema.substitutionRequests)
        .where(eq(schema.substitutionRequests.id, requestId))
        .for('update');

      if (!req) throw new ConflictException('Request not found');

      if (req.status !== 'Pending' && req.status !== 'Accepted') {
        throw new ConflictException('Can only approve/reject Pending or Accepted requests');
      }

      const newStatus = approved ? 'Approved' : 'Rejected';
      const actualSubId = req.acceptedById || req.requestedSubstituteId;

      if (approved && !actualSubId) {
         throw new ConflictException('Cannot approve a broadcast request that has not been accepted by a teacher');
      }

      const [updated] = await tx.update(schema.substitutionRequests)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(schema.substitutionRequests.id, requestId))
        .returning();

      if (approved) {
        const [session] = await tx
          .select()
          .from(schema.classSessions)
          .where(eq(schema.classSessions.id, req.sessionId))
          .for('update');

        if (session.actualTeacherId !== actualSubId) {
          await tx.update(schema.classSessions)
            .set({ actualTeacherId: actualSubId! })
            .where(eq(schema.classSessions.id, req.sessionId));
            
          await tx.insert(schema.auditLogs).values({
            tableName: 'class_sessions',
            recordId: req.sessionId,
            action: 'UPDATE_SESSION_TEACHER',
            changedBy: supervisorUserId,
            oldData: { actualTeacherId: session.actualTeacherId },
            newData: { actualTeacherId: actualSubId },
          });
        }
      }

      await tx.insert(schema.auditLogs).values({
        tableName: 'substitution_requests',
        recordId: requestId,
        action: approved ? 'APPROVE_SUBSTITUTION' : 'REJECT_SUBSTITUTION',
        changedBy: supervisorUserId,
        oldData: { status: req.status },
        newData: { status: newStatus },
      });

      return updated;
    });
  }
}
