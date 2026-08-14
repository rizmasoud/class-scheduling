import { describe, it, expect, vi } from 'vitest';
import { ProposalAssembler, ProposalAssemblerInput, AssemblerCandidate } from '../proposal-assembler';
import { SchedulingContext } from '../../models/scheduling-context';
import { Book, Teacher } from '@/domain/models';
import { ClassCandidate } from '../../models/class-candidate';
import { TimeSlot } from '../../models/time-slot';

describe('ProposalAssembler', () => {
  const slot: TimeSlot = { id: 's1', weekDay: 'Monday', startTime: '10:00', endTime: '12:00' };
  
  const book1: Book = { id: 'b1', name: 'Math 101', level: 1, sequenceOrder: 1, sessionCount: 10 };
  const teacher1: Teacher = { id: 't1', fullName: 'John Doe', notes: null };
  const teacher2: Teacher = { id: 't2', fullName: 'Jane Smith', notes: null };

  const context: SchedulingContext = {
    activeBooks: [book1],
    activeTeachers: [teacher1, teacher2],
    activeStudents: [],
    activeClasses: []
  };

  it('assembles an empty candidate list', () => {
    const assembler = new ProposalAssembler();
    
    const input: ProposalAssemblerInput = {
      proposalId: 'prop-1',
      generatedAt: '2023-01-01T10:00:00Z',
      candidates: [],
      context,
      unscheduledStudents: [],
      generateProposalClassId: () => 'pc-1',
      generateProposalClassScheduleId: () => 'ps-1'
    };

    const proposal = assembler.assemble(input);

    expect(proposal.id).toBe('prop-1');
    expect(proposal.generatedAt).toBe('2023-01-01T10:00:00Z');
    expect(proposal.status).toBe('Draft');
    expect(proposal.notes).toBeNull();
    expect(proposal.classes).toEqual([]);
  });

  it('assembles one candidate with correct generated name and schedule', () => {
    const assembler = new ProposalAssembler();

    const classCandidate: ClassCandidate = {
      bookId: 'b1',
      teacherId: 't1',
      studentIds: ['st1'],
      timeSlot: slot
    };

    const cand: AssemblerCandidate = {
      candidate: classCandidate,
      score: 85,
      reasons: ['Good match', 'Teacher available']
    };

    let classIdCounter = 1;
    let scheduleIdCounter = 1;

    const input: ProposalAssemblerInput = {
      proposalId: 'prop-1',
      generatedAt: '2023-01-01T10:00:00Z',
      candidates: [cand],
      context,
      unscheduledStudents: [],
      generateProposalClassId: () => `pc-${classIdCounter++}`,
      generateProposalClassScheduleId: () => `ps-${scheduleIdCounter++}`
    };

    const proposal = assembler.assemble(input);

    expect(proposal.classes).toBeDefined();
    expect(proposal.classes).toHaveLength(1);

    const pc = proposal.classes![0];
    expect(pc.id).toBe('pc-1');
    expect(pc.proposalId).toBe('prop-1');
    expect(pc.bookId).toBe('b1');
    expect(pc.teacherId).toBe('t1');
    expect(pc.generatedName).toBe('Math 101 - John Doe');
    expect(pc.customName).toBeNull();
    expect(pc.score).toBe(85);
    expect(pc.reasons).toEqual(['Good match', 'Teacher available']);
    expect(pc.editedBySupervisor).toBe(false);
    expect(pc.status).toBe('Pending');
    expect(pc.notes).toBeNull();
    
    expect(pc.schedules).toBeDefined();
    expect(pc.schedules).toHaveLength(1);
    
    const ps = pc.schedules![0];
    expect(ps.id).toBe('ps-1');
    expect(ps.proposalClassId).toBe('pc-1');
    expect(ps.weekDay).toBe('Monday');
    expect(ps.startTime).toBe('10:00');
    expect(ps.endTime).toBe('12:00');
  });

  it('assembles candidate without teacher (null teacher handling check)', () => {
    const assembler = new ProposalAssembler();

    const classCandidate = {
      bookId: 'b1',
      teacherId: null as any, // assuming it could be null if no teacher assigned yet
      studentIds: [],
      timeSlot: slot
    };

    const cand: AssemblerCandidate = {
      candidate: classCandidate,
      score: 50,
      reasons: []
    };

    const input: ProposalAssemblerInput = {
      proposalId: 'prop-1',
      generatedAt: '2023-01-01T10:00:00Z',
      candidates: [cand],
      context,
      unscheduledStudents: [],
      generateProposalClassId: () => 'pc-1',
      generateProposalClassScheduleId: () => 'ps-1'
    };

    const proposal = assembler.assemble(input);
    const pc = proposal.classes![0];

    expect(pc.generatedName).toBe('Math 101');
  });

  it('assembles multiple candidates with distinct IDs via callbacks', () => {
    const assembler = new ProposalAssembler();

    const cand1: AssemblerCandidate = {
      candidate: { bookId: 'b1', teacherId: 't1', studentIds: [], timeSlot: slot },
      score: 90,
      reasons: []
    };
    const cand2: AssemblerCandidate = {
      candidate: { bookId: 'b1', teacherId: 't2', studentIds: [], timeSlot: slot },
      score: 80,
      reasons: []
    };

    let classIdCounter = 1;
    let scheduleIdCounter = 1;

    const input: ProposalAssemblerInput = {
      proposalId: 'prop-1',
      generatedAt: '2023-01-01T10:00:00Z',
      candidates: [cand1, cand2],
      context,
      unscheduledStudents: [],
      generateProposalClassId: () => `pc-${classIdCounter++}`,
      generateProposalClassScheduleId: () => `ps-${scheduleIdCounter++}`
    };

    const proposal = assembler.assemble(input);

    expect(proposal.classes).toHaveLength(2);
    
    expect(proposal.classes![0].id).toBe('pc-1');
    expect(proposal.classes![0].schedules![0].id).toBe('ps-1');
    expect(proposal.classes![0].generatedName).toBe('Math 101 - John Doe');
    
    expect(proposal.classes![1].id).toBe('pc-2');
    expect(proposal.classes![1].schedules![0].id).toBe('ps-2');
    expect(proposal.classes![1].generatedName).toBe('Math 101 - Jane Smith');
  });
});
