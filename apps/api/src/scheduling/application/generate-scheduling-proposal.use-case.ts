import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ISchedulingRunner } from './i-scheduling-runner.port';
import { ISchedulingContextLoader } from './i-scheduling-context-loader.port';
import { GenerateSchedulingProposalRequestDTO, SchedulingProposalDetailDTO, ProposalClassStatus, WeekDay } from '@class-scheduling/contracts';
import { SchedulingEngineConfig } from '@class-scheduling/domain';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PG_CONNECTION } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class GenerateSchedulingProposalUseCase {
  constructor(
    @Inject(ISchedulingRunner) private readonly runner: ISchedulingRunner,
    @Inject(ISchedulingContextLoader) private readonly contextLoader: ISchedulingContextLoader,
    @Inject(PG_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(request: GenerateSchedulingProposalRequestDTO): Promise<SchedulingProposalDetailDTO> {
    const term = await this.db.query.academicTerms.findFirst({
      where: eq(schema.academicTerms.id, request.termId),
    });
    if (!term) {
      throw new NotFoundException(`Academic term ${request.termId} not found`);
    }

    // Check if an active Draft already exists for this term before starting computation
    const existingDraft = await this.db.query.schedulingProposals.findFirst({
      where: and(
        eq(schema.schedulingProposals.termId, request.termId),
        eq(schema.schedulingProposals.status, 'Draft')
      ),
    });
    if (existingDraft) {
      throw new BadRequestException(`A Draft proposal already exists for term ${request.termId}`);
    }

    const proposalId = randomUUID();

    // 1. Load registry data through abstraction (outside DB transaction)
    const context = await this.contextLoader.loadContext(request.termId);

    // 2. Build configuration snapshot without hardcoded capacities
    const config: SchedulingEngineConfig = {
      minimumCapacity: request.config?.minimumCapacity ?? 5,
      preferredCapacity: request.config?.preferredCapacity ?? 10,
      maximumCapacity: request.config?.maximumCapacity ?? 15,
      ruleWeights: {
        teacherPreferenceWeight: request.config?.ruleWeights?.teacherPreferenceWeight ?? 1,
        capacityWeight: request.config?.ruleWeights?.capacityWeight ?? 1,
        bookCompatibilityWeight: request.config?.ruleWeights?.bookCompatibilityWeight ?? 1,
        optimalCapacityWeight: request.config?.ruleWeights?.optimalCapacityWeight ?? 1,
        balancedDistributionWeight: request.config?.ruleWeights?.balancedDistributionWeight ?? 1,
      },
      timeSlotConfig: {
        allowedDaysOfWeek: request.config?.timeSlotConfig?.allowedDaysOfWeek ?? [
          'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'
        ],
        instituteHours: {
          openingTime: request.config?.timeSlotConfig?.instituteHours?.openingTime ?? '08:00',
          closingTime: request.config?.timeSlotConfig?.instituteHours?.closingTime ?? '20:00',
        },
        classDurationMinutes: request.config?.timeSlotConfig?.classDurationMinutes ?? 90,
      },
    };

    // 3. Domain computation begins: pure, in-memory execution through ISchedulingRunner
    const proposal = await this.runner.run({
      proposalId,
      termId: request.termId,
      context,
      config,
    });

    // 4. Persistence transaction begins: atomic persistence of proposal and all children
    try {
      await this.db.transaction(async (tx) => {
        // Enforce Draft uniqueness check inside transaction as well
        const txExistingDraft = await tx.query.schedulingProposals.findFirst({
          where: and(
            eq(schema.schedulingProposals.termId, request.termId),
            eq(schema.schedulingProposals.status, 'Draft')
          ),
        });
        if (txExistingDraft) {
          throw new BadRequestException(`A Draft proposal already exists for term ${request.termId}`);
        }

        const generatedAt = new Date(proposal.generatedAt || new Date());

        // Insert parent proposal
        await tx.insert(schema.schedulingProposals).values({
          id: proposal.id,
          termId: request.termId,
          status: 'Draft',
          configurationSnapshot: config as any,
          notes: proposal.notes,
          generatedAt,
        });

        // Insert proposal classes and their children
        if (proposal.classes && proposal.classes.length > 0) {
          const classesToInsert = proposal.classes.map((c) => ({
            id: c.id,
            proposalId: proposal.id,
            bookId: c.bookId,
            teacherId: c.teacherId,
            generatedName: c.generatedName,
            customName: c.customName,
            score: c.score,
            reasons: c.reasons,
            editedBySupervisor: c.editedBySupervisor,
            status: c.status,
            notes: c.notes,
          }));
          await tx.insert(schema.proposalClasses).values(classesToInsert);

          const studentsToInsert: Array<{ proposalClassId: string; studentId: string }> = [];
          const schedulesToInsert: Array<{
            id: string;
            proposalClassId: string;
            weekDay: string;
            startTime: string;
            endTime: string;
          }> = [];

          for (const c of proposal.classes) {
            if (c.studentIds && c.studentIds.length > 0) {
              for (const studentId of c.studentIds) {
                studentsToInsert.push({
                  proposalClassId: c.id,
                  studentId,
                });
              }
            }
            if (c.schedules && c.schedules.length > 0) {
              for (const sched of c.schedules) {
                schedulesToInsert.push({
                  id: sched.id,
                  proposalClassId: c.id,
                  weekDay: sched.weekDay,
                  startTime: sched.startTime,
                  endTime: sched.endTime,
                });
              }
            }
          }

          if (studentsToInsert.length > 0) {
            await tx.insert(schema.proposalClassStudents).values(studentsToInsert);
          }
          if (schedulesToInsert.length > 0) {
            await tx.insert(schema.proposalClassSchedules).values(schedulesToInsert);
          }
        }

        // Insert unscheduled students
        if (proposal.unscheduledStudents && proposal.unscheduledStudents.length > 0) {
          const unscheduledToInsert = proposal.unscheduledStudents.map((us) => ({
            proposalId: proposal.id,
            studentId: us.studentId,
            reasons: us.reasons,
          }));
          await tx.insert(schema.proposalUnscheduledStudents).values(unscheduledToInsert);
        }
      });
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('draft_proposal_term_idx')) {
        throw new BadRequestException(`A Draft proposal already exists for term ${request.termId}`);
      }
      throw err;
    }

    return {
      id: proposal.id,
      termId: request.termId,
      status: proposal.status as any,
      notes: proposal.notes,
      generatedAt: proposal.generatedAt,
      configurationSnapshot: config as any,
      classes:
        proposal.classes?.map((c) => ({
          id: c.id,
          proposalId: proposal.id,
          bookId: c.bookId,
          teacherId: c.teacherId,
          generatedName: c.generatedName,
          customName: c.customName,
          score: c.score,
          reasons: c.reasons,
          editedBySupervisor: c.editedBySupervisor,
          status: c.status as ProposalClassStatus,
          notes: c.notes,
          schedules:
            c.schedules?.map((s) => ({
              id: s.id,
              proposalClassId: c.id,
              weekDay: s.weekDay as WeekDay,
              startTime: s.startTime,
              endTime: s.endTime,
            })) || [],
          studentIds: [...(c.studentIds || [])],
        })) || [],
      unscheduledStudents:
        proposal.unscheduledStudents?.map((u) => ({
          studentId: u.studentId,
          reasons: [...u.reasons],
        })) || [],
    };
  }
}
