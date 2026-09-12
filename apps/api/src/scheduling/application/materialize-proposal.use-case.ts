import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PG_CONNECTION } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { projectSessionDates } from '@class-scheduling/domain';

export interface MaterializeProposalResult {
  success: boolean;
  createdClassesCount: number;
  createdSessionsCount: number;
  warnings: string[];
}

@Injectable()
export class MaterializeProposalUseCase {
  constructor(
    @Inject(PG_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(proposalId: string, supervisorUserId?: string): Promise<MaterializeProposalResult> {
    return await this.db.transaction(async (tx) => {
      // 1. Lock and load proposal with row-level lock (SELECT ... FOR UPDATE)
      const proposals = await tx
        .select()
        .from(schema.schedulingProposals)
        .where(eq(schema.schedulingProposals.id, proposalId))
        .for('update');

      const proposal = proposals[0];

      if (!proposal) {
        throw new NotFoundException('Scheduling proposal not found');
      }

      // 2. Lifecycle & Idempotency check under row-level lock
      if (proposal.status !== 'Committed') {
        throw new BadRequestException('Only Committed proposals can be materialized');
      }

      if (proposal.isMaterialized) {
        throw new BadRequestException('Proposal has already been materialized');
      }

      // Load proposal classes and their relations manually
      const proposalClasses = await tx.query.proposalClasses.findMany({
        where: eq(schema.proposalClasses.proposalId, proposalId)
      });

      const classesWithDetails = await Promise.all(proposalClasses.map(async (c) => {
        const schedules = await tx.query.proposalClassSchedules.findMany({
          where: eq(schema.proposalClassSchedules.proposalClassId, c.id)
        });
        const students = await tx.query.proposalClassStudents.findMany({
          where: eq(schema.proposalClassStudents.proposalClassId, c.id)
        });
        return { ...c, schedules, students };
      }));

      // 3. Load term details for boundaries
      const term = await tx.query.academicTerms.findFirst({
        where: eq(schema.academicTerms.id, proposal.termId),
      });

      if (!term) {
        throw new NotFoundException('Academic term not found');
      }

      // Pre-load all books for session counts
      const bookIds = classesWithDetails.map(c => c.bookId);
      const books = bookIds.length > 0 ? await tx.query.books.findMany({
        where: inArray(schema.books.id, bookIds),
      }) : [];
      const bookMap = new Map(books.map(b => [b.id, b]));

      // 4. Projection
      const warnings: string[] = [];
      const newClassesToInsert: typeof schema.classes.$inferInsert[] = [];
      const newClassSchedulesToInsert: typeof schema.classSchedules.$inferInsert[] = [];
      const newClassStudentsToInsert: typeof schema.classStudents.$inferInsert[] = [];
      const newClassSessionsToInsert: typeof schema.classSessions.$inferInsert[] = [];

      for (const propClass of classesWithDetails) {
        if (propClass.status === 'Rejected') {
          continue; // Skip rejected classes in materialization
        }

        const book = bookMap.get(propClass.bookId);
        if (!book) {
          throw new BadRequestException(`Book ${propClass.bookId} not found for class ${propClass.id}`);
        }

        const classId = randomUUID();
        const className = propClass.customName || propClass.generatedName;

        newClassesToInsert.push({
          id: classId,
          proposalId: proposal.id,
          termId: term.id,
          bookId: propClass.bookId,
          teacherId: propClass.teacherId,
          name: className,
          classType: 'Regular', // Always regular from optimizer
          status: 'Active',
        });

        for (const sched of propClass.schedules) {
          newClassSchedulesToInsert.push({
            id: randomUUID(),
            classId,
            weekDay: sched.weekDay,
            startTime: sched.startTime,
            endTime: sched.endTime,
          });
        }

        for (const stud of propClass.students) {
          newClassStudentsToInsert.push({
            classId,
            studentId: stud.studentId,
          });
        }

        const projectedSessions = projectSessionDates(
          term.startDate,
          term.endDate,
          propClass.schedules.map(s => ({
            weekDay: s.weekDay as any,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
          book.sessionCount,
          classId,
          propClass.teacherId,
          () => randomUUID()
        );

        if (projectedSessions.length < book.sessionCount) {
          warnings.push(
            `Class "${className}" requires ${book.sessionCount} sessions according to syllabus for book "${book.title}", but only ${projectedSessions.length} meeting slots were available between term dates ${term.startDate} and ${term.endDate}.`
          );
        }

        for (const session of projectedSessions) {
          newClassSessionsToInsert.push({
            id: session.id,
            classId: session.classId,
            date: session.date,
            startTime: session.startTime,
            endTime: session.endTime,
            scheduledTeacherId: session.scheduledTeacherId,
            actualTeacherId: session.actualTeacherId,
            status: session.status,
          });
        }
      }

      // 5. Insert everything
      if (newClassesToInsert.length > 0) {
        await tx.insert(schema.classes).values(newClassesToInsert);
      }
      if (newClassSchedulesToInsert.length > 0) {
        await tx.insert(schema.classSchedules).values(newClassSchedulesToInsert);
      }
      if (newClassStudentsToInsert.length > 0) {
        await tx.insert(schema.classStudents).values(newClassStudentsToInsert);
      }
      if (newClassSessionsToInsert.length > 0) {
        await tx.insert(schema.classSessions).values(newClassSessionsToInsert);
      }

      // 6. Mark proposal as materialized
      await tx.update(schema.schedulingProposals)
        .set({ isMaterialized: true, updatedAt: new Date() })
        .where(eq(schema.schedulingProposals.id, proposal.id));

      // 7. Insert Audit Log
      await tx.insert(schema.auditLogs).values({
        id: randomUUID(),
        tableName: 'scheduling_proposals',
        recordId: proposal.id,
        action: 'MATERIALIZE',
        changedBy: supervisorUserId || null,
        oldData: { isMaterialized: false },
        newData: {
          isMaterialized: true,
          createdClassIds: newClassesToInsert.map(c => c.id),
          classCount: newClassesToInsert.length,
          sessionCount: newClassSessionsToInsert.length,
          warnings,
          materializedAt: new Date().toISOString(),
        },
      });

      return {
        success: true,
        createdClassesCount: newClassesToInsert.length,
        createdSessionsCount: newClassSessionsToInsert.length,
        warnings,
      };
    });
  }
}
