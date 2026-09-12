import { Injectable, Inject, ForbiddenException, ConflictException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../infrastructure/database/schema';

@Injectable()
export class CreateSubstitutionRequestUseCase {
  constructor(
    @Inject('PG_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(
    sessionId: string, 
    requesterUserId: string, 
    requesterRole: string, 
    data: { isBroadcast: boolean; requestedSubstituteId?: string | null; reason?: string }
  ) {
    return await this.db.transaction(async (tx) => {
      const session = await tx.query.classSessions.findFirst({
        where: eq(schema.classSessions.id, sessionId),
      });

      if (!session) throw new ConflictException('Session not found');

      const cls = await tx.query.classes.findFirst({
        where: eq(schema.classes.id, session.classId),
      });

      if (!cls) throw new ConflictException('Class not found');

      if (cls.classType !== 'Regular') {
        throw new ConflictException('Substitutions are only allowed for Regular classes');
      }

      if (requesterRole === 'Teacher') {
        const teacher = await tx.query.teachers.findFirst({
          where: eq(schema.teachers.userId, requesterUserId),
        });
        if (!teacher || session.scheduledTeacherId !== teacher.id) {
          throw new ForbiddenException('Teachers can only request substitution for their own scheduled sessions');
        }
      }

      if (!data.isBroadcast && data.requestedSubstituteId) {
        const skills = await tx.query.teacherSkills.findFirst({
           where: (ts, { and, eq }) => and(eq(ts.teacherId, data.requestedSubstituteId!), eq(ts.bookId, cls.bookId)),
        });
        if (!skills) {
           throw new ConflictException('The requested substitute is not eligible to teach this book');
        }
      }

      // Check for existing active requests
      const [existing] = await tx
         .select()
         .from(schema.substitutionRequests)
         .where(eq(schema.substitutionRequests.sessionId, sessionId));

      if (existing && ['Pending', 'Broadcast', 'Accepted'].includes(existing.status)) {
         throw new ConflictException('An active substitution request already exists for this session');
      }

      const status = data.isBroadcast ? 'Broadcast' : 'Pending';

      const [req] = await tx.insert(schema.substitutionRequests).values({
        sessionId,
        requestedBy: requesterUserId,
        requestedSubstituteId: data.isBroadcast ? null : data.requestedSubstituteId,
        status,
        reason: data.reason,
      }).returning();

      await tx.insert(schema.auditLogs).values({
        tableName: 'substitution_requests',
        recordId: req.id,
        action: 'CREATE_SUBSTITUTION_REQUEST',
        changedBy: requesterUserId,
        oldData: null,
        newData: req,
      });

      return req;
    });
  }
}
