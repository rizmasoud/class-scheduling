import { Injectable, Inject, ForbiddenException, ConflictException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../infrastructure/database/schema';
import { TeacherAttendanceStatus } from '@class-scheduling/contracts';

@Injectable()
export class SubmitAttendanceUseCase {
  constructor(
    @Inject('PG_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(sessionId: string, teacherUserId: string, status: TeacherAttendanceStatus) {
    return await this.db.transaction(async (tx) => {
      const session = await tx.query.classSessions.findFirst({
        where: eq(schema.classSessions.id, sessionId),
      });

      if (!session) {
        throw new ConflictException('Session not found');
      }

      const teacher = await tx.query.teachers.findFirst({
        where: eq(schema.teachers.userId, teacherUserId),
      });

      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found for the user');
      }

      const isScheduled = session.scheduledTeacherId === teacher.id;
      const isActual = session.actualTeacherId === teacher.id;

      const [sub] = await tx
         .select()
         .from(schema.substitutionRequests)
         .where(
           and(
             eq(schema.substitutionRequests.sessionId, sessionId),
             eq(schema.substitutionRequests.acceptedById, teacher.id)
           )
         );
      const isSubstitute = !!sub && (sub.status === 'Accepted' || sub.status === 'Approved');

      if (!isScheduled && !isActual && !isSubstitute) {
        throw new ForbiddenException('Not authorized to submit attendance for this session');
      }

      if (session.status === 'Cancelled' && status === 'Present') {
         throw new ConflictException('Cannot mark a cancelled session as taught');
      }

      const [existing] = await tx
         .select()
         .from(schema.teacherAttendances)
         .where(eq(schema.teacherAttendances.sessionId, sessionId));

      if (existing) {
        throw new ConflictException('Attendance already submitted for this session');
      }

      const [attendance] = await tx.insert(schema.teacherAttendances).values({
        sessionId,
        teacherId: teacher.id,
        status: status as any,
      }).returning();

      if (status === 'Present' && session.status !== 'Completed') {
        await tx.update(schema.classSessions)
          .set({ status: 'Completed', actualTeacherId: teacher.id })
          .where(eq(schema.classSessions.id, sessionId));
        
        await tx.insert(schema.auditLogs).values({
          tableName: 'class_sessions',
          recordId: sessionId,
          action: 'COMPLETE_SESSION',
          changedBy: teacherUserId,
          oldData: { status: session.status, actualTeacherId: session.actualTeacherId },
          newData: { status: 'Completed', actualTeacherId: teacher.id },
        });
      }

      await tx.insert(schema.auditLogs).values({
        tableName: 'teacher_attendances',
        recordId: attendance.id,
        action: 'SUBMIT_ATTENDANCE',
        changedBy: teacherUserId,
        oldData: null,
        newData: attendance,
      });

      return attendance;
    });
  }
}
