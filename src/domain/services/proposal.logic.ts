import { 
  SchedulingProposal, 
  ProposalId, 
  Book, 
  Teacher, 
  Student, 
  Class,
  ClassId,
  ClassScheduleId,
  EnrollmentId,
  SchedulingProposalStatus
} from '../models';

export function canTransitionProposalStatus(from: SchedulingProposalStatus, to: SchedulingProposalStatus): boolean {
  if (from === to) return true;
  if (from === 'Draft' && (to === 'Committed' || to === 'Archived')) {
    return true;
  }
  return false;
}

export function validateProposalStatusTransition(from: SchedulingProposalStatus, to: SchedulingProposalStatus): void {
  if (from === to) return;
  if (!canTransitionProposalStatus(from, to)) {
    throw new Error(`Forbidden proposal status transition from '${from}' to '${to}'.`);
  }
}

export function generateProposalDraft(
  proposalId: ProposalId,
  books: readonly Book[],
  teachers: readonly Teacher[],
  students: readonly Student[],
  date: string
): SchedulingProposal {
  return {
    id: proposalId,
    generatedAt: date,
    status: 'Draft',
    notes: `Generated proposal based on ${students.length} students, ${teachers.length} teachers, and ${books.length} books.`,
    classes: []
  };
}

export function approveProposal(proposal: SchedulingProposal): SchedulingProposal {
  if (proposal.status !== 'Draft') {
    throw new Error(`Cannot approve proposal in '${proposal.status}' status. Only Draft proposals can be modified.`);
  }
  return {
    ...proposal,
    classes: (proposal.classes || []).map(c => 
      c.status === 'Pending' ? { ...c, status: 'Approved' } : c
    )
  };
}

export function rejectProposal(proposal: SchedulingProposal): SchedulingProposal {
  validateProposalStatusTransition(proposal.status, 'Archived');
  return {
    ...proposal,
    status: 'Archived',
    classes: (proposal.classes || []).map(c => 
      c.status === 'Pending' ? { ...c, status: 'Rejected' } : c
    )
  };
}

export function archiveProposal(proposal: SchedulingProposal): SchedulingProposal {
  validateProposalStatusTransition(proposal.status, 'Archived');
  return {
    ...proposal,
    status: 'Archived'
  };
}

export function commitProposal(
  proposal: SchedulingProposal,
  classIdGenerator: () => ClassId,
  scheduleIdGenerator: () => ClassScheduleId,
  enrollmentIdGenerator: () => EnrollmentId
): { closedProposal: SchedulingProposal, committedProposal: SchedulingProposal, newClasses: Class[] } {
  validateProposalStatusTransition(proposal.status, 'Committed');

  const approvedClasses = (proposal.classes || []).filter(c => c.status === 'Approved' || c.status === 'Pending');
  
  const now = new Date().toISOString();

  const newClasses: Class[] = approvedClasses.map(pc => {
    const classId = classIdGenerator();
    return {
      id: classId,
      name: pc.customName || pc.generatedName,
      bookId: pc.bookId,
      teacherId: pc.teacherId,
      status: 'Active',
      minCapacity: 4, 
      targetCapacity: 8,
      maxCapacity: 12,
      notes: pc.notes,
      schedules: (pc.schedules || []).map(sch => ({
        id: scheduleIdGenerator(),
        classId: classId,
        weekDay: sch.weekDay,
        startTime: sch.startTime,
        endTime: sch.endTime
      })),
      enrollments: (pc.studentIds || []).map(studentId => ({
        id: enrollmentIdGenerator(),
        classId: classId,
        studentId: studentId,
        enrollmentStatus: 'Active',
        joinedAt: now,
        leftAt: null
      }))
    };
  });

  const committedProposal: SchedulingProposal = {
    ...proposal,
    status: 'Committed'
  };

  return { closedProposal: committedProposal, committedProposal, newClasses };
}
