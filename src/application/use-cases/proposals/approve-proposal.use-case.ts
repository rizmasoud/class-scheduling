import { SchedulingProposal, ProposalId } from '@/domain/models';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';
import { approveProposal } from '@/domain/services/proposal.logic';

export class ApproveProposalUseCase {
  constructor(private readonly proposalRepository: IProposalRepository) {}

  async execute(proposalId: ProposalId): Promise<SchedulingProposal> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new Error(`Proposal with id ${proposalId} not found`);
    }

    const approvedProposal = approveProposal(proposal);
    return this.proposalRepository.save(approvedProposal);
  }
}
