import { ProposalId, TeacherId, ProposalClassId } from '@/domain/models';
import { SchedulingEngineConfig } from '@/domain/services/scheduling-engine/config/scheduling-engine.config';
import { ManualProposalEditor } from '@/domain/services/manual-editing/manual-proposal-editor';
import { BaseManualEditUseCase } from './base-manual-edit.use-case';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';
import { IBookRepository } from '@/domain/repositories/i-book.repository';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';
import { IClassRepository } from '@/domain/repositories/i-class.repository';

export interface AssignTeacherToClassDTO {
  proposalId: ProposalId;
  teacherId: TeacherId;
  classId: ProposalClassId;
  config: SchedulingEngineConfig;
}

export class AssignTeacherToProposalClassUseCase extends BaseManualEditUseCase {
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

  async execute(dto: AssignTeacherToClassDTO): Promise<void> {
    const proposal = await this.proposalRepository.findById(dto.proposalId);
    if (!proposal) throw new Error('Proposal not found');

    const context = await this.getContext();
    const updatedProposal = this.manualEditor.assignTeacher(
      proposal,
      dto.classId,
      dto.teacherId,
      context,
      dto.config
    );

    await this.proposalRepository.save(updatedProposal);
  }
}
