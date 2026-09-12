import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SchedulingProposalDetailDTO, ProposalClassStatus, WeekDay } from '@class-scheduling/contracts';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PG_CONNECTION } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class GetSchedulingProposalUseCase {
  constructor(
    @Inject(PG_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(proposalId: string): Promise<SchedulingProposalDetailDTO> {
    const proposal = await this.db.query.schedulingProposals.findFirst({
      where: eq(schema.schedulingProposals.id, proposalId),
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    const classes = await this.db.query.proposalClasses.findMany({
      where: eq(schema.proposalClasses.proposalId, proposalId),
    });

    const unscheduledStudents = await this.db.query.proposalUnscheduledStudents.findMany({
      where: eq(schema.proposalUnscheduledStudents.proposalId, proposalId),
    });

    const mappedClasses = await Promise.all(classes.map(async (c) => {
      const students = await this.db.query.proposalClassStudents.findMany({
        where: eq(schema.proposalClassStudents.proposalClassId, c.id),
      });
      const schedules = await this.db.query.proposalClassSchedules.findMany({
        where: eq(schema.proposalClassSchedules.proposalClassId, c.id),
      });

      return {
        id: c.id,
        proposalId: c.proposalId,
        bookId: c.bookId,
        teacherId: c.teacherId,
        generatedName: c.generatedName,
        customName: c.customName,
        score: c.score,
        reasons: c.reasons as string[],
        editedBySupervisor: c.editedBySupervisor,
        status: c.status as ProposalClassStatus,
        notes: c.notes,
        schedules: schedules.map(s => ({
          id: s.id,
          proposalClassId: s.proposalClassId,
          weekDay: s.weekDay as WeekDay,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        studentIds: students.map(s => s.studentId)
      };
    }));

    return {
      id: proposal.id,
      termId: proposal.termId,
      status: proposal.status as any,
      notes: proposal.notes,
      generatedAt: proposal.generatedAt.toISOString(),
      configurationSnapshot: proposal.configurationSnapshot as Record<string, any>,
      classes: mappedClasses,
      unscheduledStudents: unscheduledStudents.map(us => ({
        studentId: us.studentId,
        reasons: us.reasons as string[],
      }))
    };
  }
}
