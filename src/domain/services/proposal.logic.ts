import { 
  SchedulingProposal, 
  ProposalId, 
  Book, 
  Teacher, 
  Student, 
  Class,
  ClassId,
  ClassScheduleId
} from '../models';

export function generateProposalDraft(
  proposalId: ProposalId,
  books: readonly Book[],
  teachers: readonly Teacher[],
  students: readonly Student[],
  date: string
): SchedulingProposal {
  // Pure domain function to assemble the proposal draft
  return {
    id: proposalId,
    generatedAt: date,
    status: 'Draft',
    notes: `Generated proposal based on ${students.length} students, ${teachers.length} teachers, and ${books.length} books.`,
    classes: []
  };
}

export function approveProposal(proposal: SchedulingProposal): SchedulingProposal {
  return {
    ...proposal,
    classes: (proposal.classes || []).map(c => 
      c.status === 'Pending' ? { ...c, status: 'Approved' } : c
    )
  };
}

export function rejectProposal(proposal: SchedulingProposal): SchedulingProposal {
  return {
    ...proposal,
    status: 'Closed',
    classes: (proposal.classes || []).map(c => 
      c.status === 'Pending' ? { ...c, status: 'Rejected' } : c
    )
  };
}

export function commitProposal(
  proposal: SchedulingProposal,
  classIdGenerator: () => ClassId,
  scheduleIdGenerator: () => ClassScheduleId
): { closedProposal: SchedulingProposal, newClasses: Class[] } {
  const approvedClasses = (proposal.classes || []).filter(c => c.status === 'Approved');
  
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
      enrollments: []
    };
  });

  const closedProposal: SchedulingProposal = {
    ...proposal,
    status: 'Closed'
  };

  return { closedProposal, newClasses };
}
