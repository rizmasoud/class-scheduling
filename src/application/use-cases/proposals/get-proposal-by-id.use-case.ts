import { SchedulingProposal, ProposalId } from '@/domain/models';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';

export class GetProposalByIdUseCase {
  constructor(private readonly proposalRepository: IProposalRepository) {}

  async execute(id: ProposalId): Promise<SchedulingProposal | null> {
    return this.proposalRepository.findById(id);
  }
}
