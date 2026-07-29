import { ProposalId } from '@/domain/models';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';

export class ArchiveProposalUseCase {
  constructor(private readonly proposalRepository: IProposalRepository) {}

  async execute(id: ProposalId): Promise<void> {
    const proposal = await this.proposalRepository.findById(id);
    if (!proposal) {
      throw new Error(`Proposal with id ${id} not found`);
    }

    if (proposal.status !== 'Draft') {
      throw new Error(`Only Draft proposals may be archived. Proposal ${id} has status '${proposal.status}'.`);
    }

    await this.proposalRepository.archive(id);
  }
}
