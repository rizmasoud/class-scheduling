import {
  SchedulingProposal,
  ProposalId,
  ProposalClassId,
  ProposalClassScheduleId,
  BookId,
  TeacherId,
  WeekDay,
  SchedulingProposalStatus,
  ProposalClassStatus,
} from '@/domain/models';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';

export interface UpdateProposalClassScheduleDTO {
  id?: ProposalClassScheduleId;
  weekDay: WeekDay;
  startTime: string;
  endTime: string;
}

export interface UpdateProposalClassDTO {
  id?: ProposalClassId;
  bookId: BookId;
  teacherId?: TeacherId | null;
  generatedName: string;
  customName?: string | null;
  score?: number;
  reasons?: string[];
  editedBySupervisor?: boolean;
  status?: ProposalClassStatus;
  notes?: string | null;
  schedules?: UpdateProposalClassScheduleDTO[] | null;
}

export interface UpdateProposalDTO {
  id: ProposalId;
  generatedAt?: string;
  status?: SchedulingProposalStatus;
  notes?: string | null;
  classes?: UpdateProposalClassDTO[] | null;
}

export class UpdateProposalUseCase {
  constructor(private readonly proposalRepository: IProposalRepository) {}

  async execute(dto: UpdateProposalDTO): Promise<SchedulingProposal> {
    const existingProposal = await this.proposalRepository.findById(dto.id);
    if (!existingProposal) {
      throw new Error(`Proposal with id ${dto.id} not found`);
    }

    let updatedClasses = existingProposal.classes;
    if (dto.classes === null) {
      updatedClasses = [];
    } else if (dto.classes) {
      updatedClasses = dto.classes.map((cls) => {
        const proposalClassId = cls.id ?? (crypto.randomUUID() as ProposalClassId);
        return {
          id: proposalClassId,
          proposalId: dto.id,
          bookId: cls.bookId,
          teacherId: cls.teacherId !== undefined ? cls.teacherId : null,
          generatedName: cls.generatedName,
          customName: cls.customName !== undefined ? cls.customName : null,
          score: cls.score ?? 0,
          reasons: cls.reasons ?? [],
          editedBySupervisor: cls.editedBySupervisor ?? false,
          status: cls.status ?? 'Pending',
          notes: cls.notes !== undefined ? cls.notes : null,
          studentIds: [],
          schedules: cls.schedules
            ? cls.schedules.map((sch) => ({
                id: sch.id ?? (crypto.randomUUID() as ProposalClassScheduleId),
                proposalClassId,
                weekDay: sch.weekDay,
                startTime: sch.startTime,
                endTime: sch.endTime,
              }))
            : [],
        };
      });
    }

    const updatedProposal: SchedulingProposal = {
      ...existingProposal,
      generatedAt: dto.generatedAt ?? existingProposal.generatedAt,
      status: dto.status ?? existingProposal.status,
      notes: dto.notes !== undefined ? dto.notes : existingProposal.notes,
      classes: updatedClasses,
    };

    return this.proposalRepository.save(updatedProposal);
  }
}
