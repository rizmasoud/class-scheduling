import { SchedulingProposal, ProposalId } from '@/domain/models';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';
import { rejectProposal } from '@/domain/services/proposal.logic';

export class RejectProposalUseCase {
  constructor(private readonly proposalRepository: IProposalRepository) {}

  async execute(proposalId: ProposalId): Promise<SchedulingProposal> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new Error(`Proposal with id ${proposalId} not found`);
    }

    const rejectedProposal = rejectProposal(proposal);
    return this.proposalRepository.save(rejectedProposal);
  }
}
