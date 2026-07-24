import { SchedulingProposal, ProposalId } from '@/domain/models';

export interface IProposalRepository {
  findById(id: ProposalId): Promise<SchedulingProposal | null>;
  findAll(): Promise<readonly SchedulingProposal[]>;
  findAllActive(): Promise<readonly SchedulingProposal[]>;
  findMany(ids: readonly ProposalId[]): Promise<readonly SchedulingProposal[]>;
  save(proposal: SchedulingProposal): Promise<SchedulingProposal>;
  archive(id: ProposalId): Promise<void>;
}
