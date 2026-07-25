import { SchedulingProposal } from '@/domain/models';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';

export class GetActiveProposalsUseCase {
  constructor(private readonly proposalRepository: IProposalRepository) {}

  async execute(): Promise<readonly SchedulingProposal[]> {
    return this.proposalRepository.findAllActive();
  }
}
