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

export interface CreateProposalClassScheduleDTO {
  weekDay: WeekDay;
  startTime: string;
  endTime: string;
}

export interface CreateProposalClassDTO {
  bookId: BookId;
  teacherId?: TeacherId | null;
  generatedName: string;
  customName?: string | null;
  score?: number;
  reasons?: string[];
  editedBySupervisor?: boolean;
  status?: ProposalClassStatus;
  notes?: string | null;
  schedules?: CreateProposalClassScheduleDTO[] | null;
}

export interface CreateProposalDTO {
  generatedAt?: string;
  status?: SchedulingProposalStatus;
  notes?: string | null;
  classes?: CreateProposalClassDTO[] | null;
}

export class CreateProposalUseCase {
  constructor(private readonly proposalRepository: IProposalRepository) {}

  async execute(dto: CreateProposalDTO): Promise<SchedulingProposal> {
    const targetStatus = dto.status ?? 'Draft';
    if (targetStatus === 'Draft') {
      const existingDraft = await this.proposalRepository.findActiveDraft();
      if (existingDraft) {
        throw new Error(`A draft proposal already exists (ID: ${existingDraft.id}). Only one active draft is allowed at a time. Please commit or archive the existing draft before generating a new proposal.`);
      }
    }

    const proposalId = crypto.randomUUID() as ProposalId;

    const proposal: SchedulingProposal = {
      id: proposalId,
      generatedAt: dto.generatedAt ?? new Date().toISOString(),
      status: dto.status ?? 'Draft',
      notes: dto.notes ?? null,
      classes: dto.classes
        ? dto.classes.map((cls) => {
            const proposalClassId = crypto.randomUUID() as ProposalClassId;
            return {
              id: proposalClassId,
              proposalId,
              bookId: cls.bookId,
              teacherId: cls.teacherId ?? null,
              generatedName: cls.generatedName,
              customName: cls.customName ?? null,
              score: cls.score ?? 0,
              reasons: cls.reasons ?? [],
              editedBySupervisor: cls.editedBySupervisor ?? false,
              status: cls.status ?? 'Pending',
              notes: cls.notes ?? null,
              studentIds: [],
              schedules: cls.schedules
                ? cls.schedules.map((sch) => ({
                    id: crypto.randomUUID() as ProposalClassScheduleId,
                    proposalClassId,
                    weekDay: sch.weekDay,
                    startTime: sch.startTime,
                    endTime: sch.endTime,
                  }))
                : [],
            };
          })
        : [],
    };

    return this.proposalRepository.save(proposal);
  }
}
