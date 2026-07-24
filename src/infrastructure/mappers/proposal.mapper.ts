import { 
  SchedulingProposal as DomainSchedulingProposal,
  ProposalClass as DomainProposalClass,
  ProposalClassSchedule as DomainProposalClassSchedule,
  ProposalId,
  ProposalClassId,
  ProposalClassScheduleId,
  BookId,
  TeacherId,
  SchedulingProposalStatus as DomainSchedulingProposalStatus,
  ProposalClassStatus as DomainProposalClassStatus,
  WeekDay as DomainWeekDay
} from '@/domain/models';
import { 
  SchedulingProposal as PersistenceSchedulingProposal, InsertSchedulingProposal 
} from '@/core/database/schema/scheduling-proposals.schema';
import { 
  ProposalClass as PersistenceProposalClass, InsertProposalClass 
} from '@/core/database/schema/proposal-classes.schema';
import { 
  ProposalClassSchedule as PersistenceProposalClassSchedule, InsertProposalClassSchedule 
} from '@/core/database/schema/proposal-class-schedules.schema';
import { 
  SchedulingProposalStatus as PersistenceSchedulingProposalStatus,
  ProposalClassStatus as PersistenceProposalClassStatus,
  WeekDay as PersistenceWeekDay
} from '@/core/database/schema/enums';

export const ProposalMapper = {
  toDomain(raw: PersistenceSchedulingProposal): DomainSchedulingProposal {
    return {
      id: raw.id as ProposalId,
      generatedAt: raw.generatedAt,
      status: raw.status as DomainSchedulingProposalStatus,
      notes: raw.notes,
    };
  },
  
  toPersistence(domain: DomainSchedulingProposal): InsertSchedulingProposal {
    return {
      id: domain.id as string,
      generatedAt: domain.generatedAt,
      status: domain.status as PersistenceSchedulingProposalStatus,
      notes: domain.notes,
    };
  },

  toDomainProposalClass(raw: PersistenceProposalClass): DomainProposalClass {
    return {
      id: raw.id as ProposalClassId,
      proposalId: raw.proposalId as ProposalId,
      bookId: raw.bookId as BookId,
      teacherId: raw.teacherId as TeacherId | null,
      generatedName: raw.generatedName,
      customName: raw.customName,
      score: raw.score,
      reasons: Array.isArray(raw.reasons) ? (raw.reasons as string[]) : [],
      editedBySupervisor: raw.editedBySupervisor,
      status: raw.status as DomainProposalClassStatus,
      notes: raw.notes,
    };
  },

  toPersistenceProposalClass(domain: DomainProposalClass): InsertProposalClass {
    return {
      id: domain.id as string,
      proposalId: domain.proposalId as string,
      bookId: domain.bookId as string,
      teacherId: domain.teacherId as string | null,
      generatedName: domain.generatedName,
      customName: domain.customName,
      score: domain.score,
      reasons: domain.reasons,
      editedBySupervisor: domain.editedBySupervisor,
      status: domain.status as PersistenceProposalClassStatus,
      notes: domain.notes,
    };
  },

  toDomainProposalClassSchedule(raw: PersistenceProposalClassSchedule): DomainProposalClassSchedule {
    return {
      id: raw.id as ProposalClassScheduleId,
      proposalClassId: raw.proposalClassId as ProposalClassId,
      weekDay: raw.weekDay as DomainWeekDay,
      startTime: raw.startTime,
      endTime: raw.endTime,
    };
  },

  toPersistenceProposalClassSchedule(domain: DomainProposalClassSchedule): InsertProposalClassSchedule {
    return {
      id: domain.id as string,
      proposalClassId: domain.proposalClassId as string,
      weekDay: domain.weekDay as PersistenceWeekDay,
      startTime: domain.startTime,
      endTime: domain.endTime,
    };
  }
};
