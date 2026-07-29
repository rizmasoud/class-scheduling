import { ProposalId, StudentId, ProposalClassId } from '@/domain/models';
import { SchedulingEngineConfig } from '@/domain/services/scheduling-engine/config/scheduling-engine.config';
import { ManualProposalEditor } from '@/domain/services/manual-editing/manual-proposal-editor';
import { BaseManualEditUseCase } from './base-manual-edit.use-case';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';
import { IBookRepository } from '@/domain/repositories/i-book.repository';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';
import { IClassRepository } from '@/domain/repositories/i-class.repository';

export interface AddStudentToClassDTO {
  proposalId: ProposalId;
  studentId: StudentId;
  classId: ProposalClassId;
  config: SchedulingEngineConfig;
}

export class AddStudentToProposalClassUseCase extends BaseManualEditUseCase {
  constructor(
    proposalRepository: IProposalRepository,
    bookRepository: IBookRepository,
    teacherRepository: ITeacherRepository,
    studentRepository: IStudentRepository,
    classRepository: IClassRepository,
    private readonly manualEditor: ManualProposalEditor
  ) {
    super(proposalRepository, bookRepository, teacherRepository, studentRepository, classRepository);
  }

  async execute(dto: AddStudentToClassDTO): Promise<void> {
    const proposal = await this.proposalRepository.findById(dto.proposalId);
    if (!proposal) throw new Error('Proposal not found');

    const context = await this.getContext();
    const updatedProposal = this.manualEditor.addStudent(
      proposal,
      dto.studentId,
      dto.classId,
      context,
      dto.config
    );

    await this.proposalRepository.save(updatedProposal);
  }
}
