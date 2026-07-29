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

    if (proposal.status === 'Committed') {
      throw new Error(`Proposal with id ${proposalId} is already committed`);
    }

    if (proposal.status === 'Archived') {
      throw new Error(`Cannot commit archived proposal with id ${proposalId}`);
    }

    if (proposal.status !== 'Draft') {
      throw new Error(`Cannot commit proposal with id ${proposalId} in status '${proposal.status}'`);
    }

    const { committedProposal, newClasses } = commitProposal(
      proposal,
      () => crypto.randomUUID() as ClassId,
      () => crypto.randomUUID() as ClassScheduleId,
      () => crypto.randomUUID() as EnrollmentId
    );

    await this.proposalRepository.saveWithClasses(committedProposal, newClasses);
  }
}
