import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PG_CONNECTION } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { eq } from 'drizzle-orm';
import { SchedulingProposalStatus, ProposalSummaryDTO } from '@class-scheduling/contracts';
import { validateProposalStatusTransition } from '@class-scheduling/domain';

@Injectable()
export class UpdateSchedulingProposalStatusUseCase {
  constructor(
    @Inject(PG_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(proposalId: string, newStatus: SchedulingProposalStatus): Promise<ProposalSummaryDTO> {
    const proposal = await this.db.query.schedulingProposals.findFirst({
      where: eq(schema.schedulingProposals.id, proposalId),
    });

    if (!proposal) {
      throw new NotFoundException('Scheduling proposal not found');
    }

    try {
      validateProposalStatusTransition(proposal.status as SchedulingProposalStatus, newStatus);
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Invalid status transition');
    }

    const [updated] = await this.db
      .update(schema.schedulingProposals)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(schema.schedulingProposals.id, proposalId))
      .returning();

    return {
      id: updated.id,
      termId: updated.termId,
      status: updated.status as SchedulingProposalStatus,
      notes: updated.notes,
      generatedAt: updated.generatedAt.toISOString(),
    };
  }
}
