import { SchedulingProposal, ProposalId } from '@/domain/models';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';
import { IBookRepository } from '@/domain/repositories/i-book.repository';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';
import { IClassRepository } from '@/domain/repositories/i-class.repository';
import { SchedulingEngine } from '@/domain/services/scheduling-engine/scheduling-engine';
import { SchedulingEngineConfig } from '@/domain/services/scheduling-engine/config/scheduling-engine.config';

export interface GenerateProposalDTO {
  date: string;
  config: SchedulingEngineConfig;
}

export class GenerateProposalUseCase {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly teacherRepository: ITeacherRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly classRepository: IClassRepository,
    private readonly proposalRepository: IProposalRepository,
    private readonly schedulingEngine: SchedulingEngine
  ) {}

  async execute(dto: GenerateProposalDTO): Promise<SchedulingProposal> {
    const existingDraft = await this.proposalRepository.findActiveDraft();
    if (existingDraft) {
      throw new Error(`A draft proposal already exists (ID: ${existingDraft.id}). Only one active draft is allowed at a time. Please commit or archive the existing draft before generating a new proposal.`);
    }

    const [books, teachers, students, classes] = await Promise.all([
      this.bookRepository.findAllActive(),
      this.teacherRepository.findAllActive(),
      this.studentRepository.findAllActive(),
      this.classRepository.findAllActive()
    ]);

    const proposalId = crypto.randomUUID() as ProposalId;

    const proposal = this.schedulingEngine.generateProposal({
      proposalId,
      generatedAt: dto.date,
      activeBooks: books,
      activeTeachers: teachers,
      activeStudents: students,
      activeClasses: classes,
      config: dto.config,
      generateProposalClassId: () => crypto.randomUUID(),
      generateProposalClassScheduleId: () => crypto.randomUUID()
    });

    if (!proposal.classes || proposal.classes.length === 0) {
      return proposal;
    }
    return this.proposalRepository.save(proposal);
  }
}
