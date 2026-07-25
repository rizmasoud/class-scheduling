import { ProposalId } from '@/domain/models';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';

export class ArchiveProposalUseCase {
  constructor(private readonly proposalRepository: IProposalRepository) {}

  async execute(id: ProposalId): Promise<void> {
    await this.proposalRepository.archive(id);
  }
}
