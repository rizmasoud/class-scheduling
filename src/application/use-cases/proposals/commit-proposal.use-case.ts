import { ProposalId, ClassId, ClassScheduleId, EnrollmentId } from '@/domain/models';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';
import { commitProposal } from '@/domain/services/proposal.logic';

export class CommitProposalUseCase {
  constructor(private readonly proposalRepository: IProposalRepository) {}

  async execute(proposalId: ProposalId): Promise<void> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new Error(`Proposal with id ${proposalId} not found`);
    }

    if (proposal.status === 'Closed') {
      throw new Error(`Proposal with id ${proposalId} is already closed`);
    }

    const { closedProposal, newClasses } = commitProposal(
      proposal,
      () => crypto.randomUUID() as ClassId,
      () => crypto.randomUUID() as ClassScheduleId,
      () => crypto.randomUUID() as EnrollmentId
    );

    await this.proposalRepository.saveWithClasses(closedProposal, newClasses);
  }
}
