import { SchedulingProposal, ProposalClass, Teacher, Student, Book, Class, ProposalId, ProposalClassId, StudentId, TeacherId } from '@/domain/models';
import { RuleEngine } from '../scheduling-engine/rules/rule-engine';
import { SchedulingContext } from '../scheduling-engine/models/scheduling-context';
import { SchedulingEngineConfig } from '../scheduling-engine/config/scheduling-engine.config';
import { ClassCandidate } from '../scheduling-engine/models/class-candidate';
import { TimeSlot } from '../scheduling-engine/models/time-slot';

export class ManualProposalEditor {
  constructor(private readonly ruleEngine: RuleEngine) {}

  private validateClass(
    proposalClass: ProposalClass,
    context: SchedulingContext,
    config: SchedulingEngineConfig
  ): { valid: boolean; score: number; reasons: string[] } {
    if (!proposalClass.schedules || proposalClass.schedules.length === 0) {
      return { valid: true, score: 0, reasons: [] };
    }

    // Treat each schedule as a separate candidate validation, and combine results.
    // However, the rule engine rules (capacity, teacher conflict) evaluate the class block.
    // For simplicity, we can validate using the first schedule as the main time slot.
    // Since we don't support multi-schedule in the rules well anyway, let's map the first schedule.
    const schedule = proposalClass.schedules[0];
    const timeSlot: TimeSlot = {
      id: schedule.id,
      weekDay: schedule.weekDay,
      startTime: schedule.startTime,
      endTime: schedule.endTime
    };

    const candidate: ClassCandidate = {
      teacherId: proposalClass.teacherId as any,
      bookId: proposalClass.bookId,
      studentIds: proposalClass.studentIds || [],
      timeSlot
    };

    const result = this.ruleEngine.evaluate(candidate, context, config);
    return {
      valid: result.valid,
      score: result.totalScore,
      reasons: [...result.reasons]
    };
  }

  private updateProposalClass(
    proposal: SchedulingProposal,
    updatedClass: ProposalClass,
    context: SchedulingContext,
    config: SchedulingEngineConfig
  ): SchedulingProposal {
    const validation = this.validateClass(updatedClass, context, config);
    if (!validation.valid) {
      throw new Error(`Invalid edit: ${validation.reasons.join(', ')}`);
    }

    const newClass: ProposalClass = {
      ...updatedClass,
      score: validation.score,
      reasons: validation.reasons,
      editedBySupervisor: true,
      status: 'Pending'
    };

    const classes = (proposal.classes || []).map(c => c.id === newClass.id ? newClass : c);
    return { ...proposal, classes };
  }

  moveStudent(
    proposal: SchedulingProposal,
    studentId: StudentId,
    fromClassId: ProposalClassId,
    toClassId: ProposalClassId,
    context: SchedulingContext,
    config: SchedulingEngineConfig
  ): SchedulingProposal {
    const fromClass = proposal.classes?.find(c => c.id === fromClassId);
    const toClass = proposal.classes?.find(c => c.id === toClassId);
    if (!fromClass || !toClass) throw new Error('Class not found');

    if (!fromClass.studentIds?.includes(studentId)) {
      throw new Error('Student not in the source class');
    }
    if (toClass.studentIds?.includes(studentId)) {
      throw new Error('Student already in target class');
    }

    const updatedFrom = { ...fromClass, studentIds: fromClass.studentIds!.filter(id => id !== studentId) };
    const updatedTo = { ...toClass, studentIds: [...(toClass.studentIds || []), studentId] };

    // Validate both
    const valFrom = this.validateClass(updatedFrom, context, config);
    if (!valFrom.valid) throw new Error(`Invalid source class after edit: ${valFrom.reasons.join(', ')}`);
    
    const valTo = this.validateClass(updatedTo, context, config);
    if (!valTo.valid) throw new Error(`Invalid target class after edit: ${valTo.reasons.join(', ')}`);

    const newClasses = (proposal.classes || []).map(c => {
      if (c.id === fromClassId) return { ...updatedFrom, score: valFrom.score, reasons: valFrom.reasons, editedBySupervisor: true, status: 'Pending' } as ProposalClass;
      if (c.id === toClassId) return { ...updatedTo, score: valTo.score, reasons: valTo.reasons, editedBySupervisor: true, status: 'Pending' } as ProposalClass;
      return c;
    });

    return { ...proposal, classes: newClasses };
  }

  removeStudent(
    proposal: SchedulingProposal,
    studentId: StudentId,
    classId: ProposalClassId,
    context: SchedulingContext,
    config: SchedulingEngineConfig
  ): SchedulingProposal {
    const pClass = proposal.classes?.find(c => c.id === classId);
    if (!pClass) throw new Error('Class not found');
    
    if (!pClass.studentIds?.includes(studentId)) {
      throw new Error('Student not in the class');
    }
    
    const updated = { ...pClass, studentIds: pClass.studentIds!.filter(id => id !== studentId) };
    return this.updateProposalClass(proposal, updated, context, config);
  }

  addStudent(
    proposal: SchedulingProposal,
    studentId: StudentId,
    classId: ProposalClassId,
    context: SchedulingContext,
    config: SchedulingEngineConfig
  ): SchedulingProposal {
    const pClass = proposal.classes?.find(c => c.id === classId);
    if (!pClass) throw new Error('Class not found');
    
    if (pClass.studentIds?.includes(studentId)) {
      throw new Error('Student already in the class');
    }
    
    const updated = { ...pClass, studentIds: [...(pClass.studentIds || []), studentId] };
    return this.updateProposalClass(proposal, updated, context, config);
  }

  swapStudents(
    proposal: SchedulingProposal,
    studentId1: StudentId,
    classId1: ProposalClassId,
    studentId2: StudentId,
    classId2: ProposalClassId,
    context: SchedulingContext,
    config: SchedulingEngineConfig
  ): SchedulingProposal {
    const pClass1 = proposal.classes?.find(c => c.id === classId1);
    const pClass2 = proposal.classes?.find(c => c.id === classId2);
    if (!pClass1 || !pClass2) throw new Error('Class not found');
    
    if (!pClass1.studentIds?.includes(studentId1)) throw new Error('Student 1 not in class 1');
    if (!pClass2.studentIds?.includes(studentId2)) throw new Error('Student 2 not in class 2');

    const updated1 = { 
      ...pClass1, 
      studentIds: [...pClass1.studentIds!.filter(id => id !== studentId1), studentId2] 
    };
    const updated2 = { 
      ...pClass2, 
      studentIds: [...pClass2.studentIds!.filter(id => id !== studentId2), studentId1] 
    };

    const val1 = this.validateClass(updated1, context, config);
    if (!val1.valid) throw new Error(`Invalid class 1 after edit: ${val1.reasons.join(', ')}`);
    
    const val2 = this.validateClass(updated2, context, config);
    if (!val2.valid) throw new Error(`Invalid class 2 after edit: ${val2.reasons.join(', ')}`);

    const newClasses = (proposal.classes || []).map(c => {
      if (c.id === classId1) return { ...updated1, score: val1.score, reasons: val1.reasons, editedBySupervisor: true, status: 'Pending' } as ProposalClass;
      if (c.id === classId2) return { ...updated2, score: val2.score, reasons: val2.reasons, editedBySupervisor: true, status: 'Pending' } as ProposalClass;
      return c;
    });

    return { ...proposal, classes: newClasses };
  }

  assignTeacher(
    proposal: SchedulingProposal,
    classId: ProposalClassId,
    teacherId: TeacherId,
    context: SchedulingContext,
    config: SchedulingEngineConfig
  ): SchedulingProposal {
    const pClass = proposal.classes?.find(c => c.id === classId);
    if (!pClass) throw new Error('Class not found');
    
    const updated = { ...pClass, teacherId };
    return this.updateProposalClass(proposal, updated, context, config);
  }

  changeSchedule(
    proposal: SchedulingProposal,
    classId: ProposalClassId,
    weekDay: string,
    startTime: string,
    endTime: string,
    context: SchedulingContext,
    config: SchedulingEngineConfig
  ): SchedulingProposal {
    const pClass = proposal.classes?.find(c => c.id === classId);
    if (!pClass) throw new Error('Class not found');
    if (!pClass.schedules || pClass.schedules.length === 0) throw new Error('Class has no schedule');
    
    const schedule = pClass.schedules[0];
    const updatedSchedule = {
      ...schedule,
      weekDay: weekDay as any,
      startTime,
      endTime
    };

    const updated = { ...pClass, schedules: [updatedSchedule] };
    return this.updateProposalClass(proposal, updated, context, config);
  }
}
