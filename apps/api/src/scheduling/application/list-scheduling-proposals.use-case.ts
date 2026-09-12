import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PG_CONNECTION } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { eq, desc } from 'drizzle-orm';
import { ProposalSummaryDTO, SchedulingProposalStatus } from '@class-scheduling/contracts';

@Injectable()
export class ListSchedulingProposalsUseCase {
  constructor(
    @Inject(PG_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(termId?: string): Promise<ProposalSummaryDTO[]> {
    const proposals = termId
      ? await this.db.query.schedulingProposals.findMany({
          where: eq(schema.schedulingProposals.termId, termId),
          orderBy: [desc(schema.schedulingProposals.createdAt)],
        })
      : await this.db.query.schedulingProposals.findMany({
          orderBy: [desc(schema.schedulingProposals.createdAt)],
        });

    return proposals.map((p) => ({
      id: p.id,
      termId: p.termId,
      status: p.status as SchedulingProposalStatus,
      notes: p.notes,
      generatedAt: p.generatedAt.toISOString(),
    }));
  }
}
