import { SchedulingProposal, ProposalId } from '@/domain/models';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';
import { IBookRepository } from '@/domain/repositories/i-book.repository';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';
import { generateProposalDraft } from '@/domain/services/proposal.logic';

export interface GenerateProposalDTO {
  date: string;
}

export class GenerateProposalUseCase {
  constructor(
    private readonly proposalRepository: IProposalRepository,
    private readonly bookRepository: IBookRepository,
    private readonly teacherRepository: ITeacherRepository,
    private readonly studentRepository: IStudentRepository
  ) {}

  async execute(dto: GenerateProposalDTO): Promise<SchedulingProposal> {
    const [books, teachers, students] = await Promise.all([
      this.bookRepository.findAllActive(),
      this.teacherRepository.findAllActive(),
      this.studentRepository.findAllActive()
    ]);

    const proposalId = crypto.randomUUID() as ProposalId;
    const proposal = generateProposalDraft(
      proposalId,
      books,
      teachers,
      students,
      dto.date
    );

    return this.proposalRepository.save(proposal);
  }
}
