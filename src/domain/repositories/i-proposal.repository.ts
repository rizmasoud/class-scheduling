import { SchedulingProposal, ProposalId, Class } from '@/domain/models';

export interface IProposalRepository {
  findById(id: ProposalId): Promise<SchedulingProposal | null>;
  findActiveDraft(): Promise<SchedulingProposal | null>;
  findAll(): Promise<readonly SchedulingProposal[]>;
  findAllActive(): Promise<readonly SchedulingProposal[]>;
  findMany(ids: readonly ProposalId[]): Promise<readonly SchedulingProposal[]>;
  save(proposal: SchedulingProposal): Promise<SchedulingProposal>;
  saveWithClasses(proposal: SchedulingProposal, newClasses: readonly Class[]): Promise<void>;
  archive(id: ProposalId): Promise<void>;
}
