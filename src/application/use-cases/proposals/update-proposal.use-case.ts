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
import { validateProposalStatusTransition } from '@/domain/services/proposal.logic';

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

    if (dto.status && dto.status !== existingProposal.status) {
      validateProposalStatusTransition(existingProposal.status, dto.status);
    }

    if (existingProposal.status !== 'Draft' && dto.classes !== undefined) {
      throw new Error(`Cannot edit proposal in '${existingProposal.status}' status. Only Draft proposals can be edited.`);
    }

    let updatedClasses = existingProposal.classes;
    if (dto.classes === null) {
      updatedClasses = [];
    } else if (dto.classes) {
      updatedClasses = dto.classes.map((cls) => {
        const existingClass = existingProposal.classes?.find(c => c.id === cls.id);
        const proposalClassId = cls.id ?? (crypto.randomUUID() as ProposalClassId);

        return {
          id: proposalClassId,
          proposalId: dto.id,
          bookId: cls.bookId,
          teacherId: cls.teacherId !== undefined ? cls.teacherId : (existingClass?.teacherId ?? null),
          generatedName: cls.generatedName,
          customName: cls.customName !== undefined ? cls.customName : (existingClass?.customName ?? null),
          score: cls.score ?? existingClass?.score ?? 0,
          reasons: cls.reasons ?? existingClass?.reasons ?? [],
          editedBySupervisor: cls.editedBySupervisor ?? existingClass?.editedBySupervisor ?? false,
          status: cls.status ?? existingClass?.status ?? 'Pending',
          notes: cls.notes !== undefined ? cls.notes : (existingClass?.notes ?? null),
          studentIds: existingClass?.studentIds ?? [],
          schedules: cls.schedules
            ? cls.schedules.map((sch) => ({
                id: sch.id ?? (crypto.randomUUID() as ProposalClassScheduleId),
                proposalClassId,
                weekDay: sch.weekDay,
                startTime: sch.startTime,
                endTime: sch.endTime,
              }))
            : (existingClass?.schedules ?? []),
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
