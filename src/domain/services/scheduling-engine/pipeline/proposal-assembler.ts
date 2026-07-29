import { ClassCandidate } from '../models/class-candidate';
import { SchedulingContext } from '../models/scheduling-context';
import { SchedulingProposal, ProposalClass, ProposalClassSchedule, WeekDay } from '@/domain/models';

export interface AssemblerCandidate {
  readonly candidate: ClassCandidate;
  readonly score: number;
  readonly reasons: readonly string[];
}

export interface ProposalAssemblerInput {
  proposalId: string;
  generatedAt: string;
  candidates: readonly AssemblerCandidate[];
  context: SchedulingContext;
  generateProposalClassId: () => string;
  generateProposalClassScheduleId: () => string;
}

export class ProposalAssembler {
  assemble(input: ProposalAssemblerInput): SchedulingProposal {
    const classes = input.candidates.map(item => {
      const { candidate, score, reasons } = item;
      
      const book = input.context.activeBooks.find(b => b.id === candidate.bookId);
      const bookName = book ? book.name : 'Unknown Book';
      
      let teacherName = '';
      if (candidate.teacherId) {
        const teacher = input.context.activeTeachers.find(t => t.id === candidate.teacherId);
        if (teacher) {
          teacherName = teacher.fullName;
        }
      }
      
      const generatedName = teacherName ? `${bookName} - ${teacherName}` : bookName;
      
      const proposalClassId = input.generateProposalClassId();
      
      const schedule: ProposalClassSchedule = {
        id: input.generateProposalClassScheduleId(),
        proposalClassId,
        weekDay: candidate.timeSlot.weekDay as WeekDay,
        startTime: candidate.timeSlot.startTime,
        endTime: candidate.timeSlot.endTime
      };

      const proposalClass: ProposalClass = {
        id: proposalClassId,
        proposalId: input.proposalId,
        bookId: candidate.bookId,
        teacherId: candidate.teacherId,
        generatedName,
        customName: null,
        score,
        reasons: [...reasons],
        studentIds: [...candidate.studentIds],
        editedBySupervisor: false,
        status: 'Pending',
        notes: null,
        schedules: [schedule]
      };

      return proposalClass;
    });

    return {
      id: input.proposalId,
      generatedAt: input.generatedAt,
      status: 'Draft',
      notes: null,
      classes
    };
  }
}
