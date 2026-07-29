import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '@/infrastructure/repositories/__tests__/db-setup';
import { ProposalRepository } from '@/infrastructure/repositories/proposal.repository';
import { BookRepository } from '@/infrastructure/repositories/book.repository';
import { TeacherRepository } from '@/infrastructure/repositories/teacher.repository';
import { StudentRepository } from '@/infrastructure/repositories/student.repository';
import { ClassRepository } from '@/infrastructure/repositories/class.repository';
import { GenerateProposalUseCase } from '../generate-proposal.use-case';
import { CommitProposalUseCase } from '../commit-proposal.use-case';
import { ArchiveProposalUseCase } from '../archive-proposal.use-case';
import { MoveStudentBetweenProposalClassesUseCase } from '../manual-editing/move-student.use-case';
import { AssignTeacherToProposalClassUseCase } from '../manual-editing/assign-teacher.use-case';
import { ChangeProposalClassScheduleUseCase } from '../manual-editing/change-schedule.use-case';
import { SchedulingEngine } from '@/domain/services/scheduling-engine/scheduling-engine';
import { TimeSlotGenerator } from '@/domain/services/scheduling-engine/pipeline/time-slot-generator';
import { CandidateGenerator } from '@/domain/services/scheduling-engine/pipeline/candidate-generator';
import { RuleEngine } from '@/domain/services/scheduling-engine/rules/rule-engine';
import { Optimizer } from '@/domain/services/scheduling-engine/pipeline/optimizer';
import { ProposalAssembler } from '@/domain/services/scheduling-engine/pipeline/proposal-assembler';
import { CapacityLimitRule } from '@/domain/services/scheduling-engine/rules/hard-rules/capacity-limit.rule';
import { StudentDoubleBookingRule } from '@/domain/services/scheduling-engine/rules/hard-rules/student-double-booking.rule';
import { TeacherBookCompatibilityRule } from '@/domain/services/scheduling-engine/rules/hard-rules/teacher-book-compatibility.rule';
import { TeacherTimeConflictRule } from '@/domain/services/scheduling-engine/rules/hard-rules/teacher-time-conflict.rule';
import { ManualProposalEditor } from '@/domain/services/manual-editing/manual-proposal-editor';
import { Book, Teacher, Student, ProposalId, ProposalClassId, StudentId } from '@/domain/models';

describe('Proposal Lifecycle (Integration)', () => {
  let db: any;
  let bookRepo: BookRepository;
  let teacherRepo: TeacherRepository;
  let studentRepo: StudentRepository;
  let classRepo: ClassRepository;
  let proposalRepo: ProposalRepository;
  let engine: SchedulingEngine;
  let ruleEngine: RuleEngine;
  let manualEditor: ManualProposalEditor;

  beforeEach(async () => {
    db = createTestDb();
    bookRepo = new BookRepository(db);
    teacherRepo = new TeacherRepository(db);
    studentRepo = new StudentRepository(db);
    classRepo = new ClassRepository(db);
    proposalRepo = new ProposalRepository(db);

    ruleEngine = new RuleEngine([
      new CapacityLimitRule(),
      new StudentDoubleBookingRule(),
      new TeacherBookCompatibilityRule(),
      new TeacherTimeConflictRule()
    ]);

    engine = new SchedulingEngine(
      new TimeSlotGenerator(),
      new CandidateGenerator(),
      ruleEngine,
      new Optimizer(),
      new ProposalAssembler()
    );

    manualEditor = new ManualProposalEditor(ruleEngine);

    // Seed master data
    const book: Book = { id: 'book-1' as any, name: 'Level 1 Book', level: 1, sequenceOrder: 1, sessionCount: 10 };
    await bookRepo.save(book);

    const teacher1: Teacher = {
      id: 'teacher-1' as any,
      fullName: 'Teacher One',
      notes: null,
      skills: [{ id: 's-1' as any, teacherId: 'teacher-1' as any, bookId: 'book-1' as any }]
    };
    await teacherRepo.save(teacher1);

    const teacher2: Teacher = {
      id: 'teacher-2' as any,
      fullName: 'Teacher Two',
      notes: null,
      skills: [{ id: 's-2' as any, teacherId: 'teacher-2' as any, bookId: 'book-1' as any }]
    };
    await teacherRepo.save(teacher2);

    for (let i = 1; i <= 6; i++) {
      const student: Student = {
        id: `student-${i}` as any,
        fullName: `Student ${i}`,
        currentBookId: 'book-1' as any,
        notes: null
      };
      await studentRepo.save(student);
    }
  });

  const config = {
    minimumCapacity: 2,
    preferredCapacity: 4,
    maximumCapacity: 6,
    ruleWeights: { teacherPreferenceWeight: 1, capacityWeight: 1, bookCompatibilityWeight: 1 },
    timeSlotConfig: {
      allowedDaysOfWeek: ['Monday', 'Tuesday', 'Wednesday'],
      instituteHours: { openingTime: '08:00', closingTime: '20:00' },
      classDurationMinutes: 120,
    },
  };

  it('Scenario 1: Generate -> Review -> Manual Edit -> Commit (Full Persistence Verification)', async () => {
    const generateUseCase = new GenerateProposalUseCase(bookRepo, teacherRepo, studentRepo, classRepo, proposalRepo, engine);
    const generated = await generateUseCase.execute({ date: '2023-10-10', config });

    expect(generated.id).toBeDefined();
    expect(generated.status).toBe('Draft');

    // Verify draft is saved in DB
    const persistedDraft = await proposalRepo.findById(generated.id);
    expect(persistedDraft).not.toBeNull();
    expect(persistedDraft?.status).toBe('Draft');

    // Create a second class in draft to test manual editing (moving students, assigning teacher, changing schedule)
    const updatedDraft = {
      ...generated,
      classes: [
        {
          id: 'pc-1' as ProposalClassId,
          proposalId: generated.id,
          bookId: 'book-1' as any,
          teacherId: 'teacher-1' as any,
          generatedName: 'Class A',
          customName: null,
          score: 10,
          reasons: [],
          editedBySupervisor: false,
          status: 'Approved' as const,
          notes: null,
          studentIds: ['student-1' as StudentId, 'student-2' as StudentId, 'student-3' as StudentId],
          schedules: [{ id: 'sch-1' as any, proposalClassId: 'pc-1' as any, weekDay: 'Monday' as any, startTime: '08:00', endTime: '10:00' }]
        },
        {
          id: 'pc-2' as ProposalClassId,
          proposalId: generated.id,
          bookId: 'book-1' as any,
          teacherId: 'teacher-1' as any,
          generatedName: 'Class B',
          customName: null,
          score: 10,
          reasons: [],
          editedBySupervisor: false,
          status: 'Approved' as const,
          notes: null,
          studentIds: ['student-4' as StudentId, 'student-5' as StudentId],
          schedules: [{ id: 'sch-2' as any, proposalClassId: 'pc-2' as any, weekDay: 'Tuesday' as any, startTime: '10:00', endTime: '12:00' }]
        }
      ]
    };
    await proposalRepo.save(updatedDraft);

    // 1. Execute Move Student Use Case (Transfer student-1 from pc-1 to pc-2)
    const moveUseCase = new MoveStudentBetweenProposalClassesUseCase(proposalRepo, bookRepo, teacherRepo, studentRepo, classRepo, manualEditor);
    await moveUseCase.execute({
      proposalId: generated.id,
      studentId: 'student-1' as StudentId,
      fromClassId: 'pc-1' as ProposalClassId,
      toClassId: 'pc-2' as ProposalClassId,
      config
    });

    // 2. Execute Assign Teacher Use Case (Assign teacher-2 to pc-2)
    const assignTeacherUseCase = new AssignTeacherToProposalClassUseCase(proposalRepo, bookRepo, teacherRepo, studentRepo, classRepo, manualEditor);
    await assignTeacherUseCase.execute({
      proposalId: generated.id,
      teacherId: 'teacher-2' as any,
      classId: 'pc-2' as ProposalClassId,
      config
    });

    // 3. Execute Change Schedule Use Case (Change pc-2 schedule to Wednesday 14:00 - 16:00)
    const changeScheduleUseCase = new ChangeProposalClassScheduleUseCase(proposalRepo, bookRepo, teacherRepo, studentRepo, classRepo, manualEditor);
    await changeScheduleUseCase.execute({
      proposalId: generated.id,
      classId: 'pc-2' as ProposalClassId,
      weekDay: 'Wednesday',
      startTime: '14:00',
      endTime: '16:00',
      config
    });

    // Verify all manual edits reflected in Proposal DB
    const editedProposal = await proposalRepo.findById(generated.id);
    const pc1 = editedProposal?.classes?.find(c => c.id === 'pc-1');
    const pc2 = editedProposal?.classes?.find(c => c.id === 'pc-2');
    expect(pc1?.studentIds).not.toContain('student-1');
    expect(pc2?.studentIds).toContain('student-1');
    expect(pc2?.teacherId).toBe('teacher-2');
    expect(pc2?.schedules?.[0]?.weekDay).toBe('Wednesday');
    expect(pc2?.schedules?.[0]?.startTime).toBe('14:00');
    expect(pc2?.schedules?.[0]?.endTime).toBe('16:00');

    // Execute Commit Use Case
    const commitUseCase = new CommitProposalUseCase(proposalRepo);
    await commitUseCase.execute(generated.id);

    // Verify committed proposal status in DB
    const committedProposal = await proposalRepo.findById(generated.id);
    expect(committedProposal?.status).toBe('Committed');

    // Verify generated active domain classes in DB reflect all manual edits!
    const activeClasses = await classRepo.findAllActive();
    expect(activeClasses.length).toBe(2);
    
    const committedClass2 = activeClasses.find(c => c.teacherId === 'teacher-2');
    expect(committedClass2).toBeDefined();
    expect(committedClass2?.schedules?.[0]?.weekDay).toBe('Wednesday');
    expect(committedClass2?.schedules?.[0]?.startTime).toBe('14:00');
    expect(committedClass2?.schedules?.[0]?.endTime).toBe('16:00');
  });

  it('Scenario 2: Generate -> Archive (Persistence Verification)', async () => {
    const generateUseCase = new GenerateProposalUseCase(bookRepo, teacherRepo, studentRepo, classRepo, proposalRepo, engine);
    const generated = await generateUseCase.execute({ date: '2023-10-10', config });

    const archiveUseCase = new ArchiveProposalUseCase(proposalRepo);
    await archiveUseCase.execute(generated.id);

    // Verify proposal status is Archived and inactive
    const activeProposals = await proposalRepo.findAllActive();
    expect(activeProposals.find(p => p.id === generated.id)).toBeUndefined();

    const allProposals = await proposalRepo.findAll();
    const archived = allProposals.find(p => p.id === generated.id);
    expect(archived).toBeDefined();
    expect(archived?.status).toBe('Archived');
  });

  it('Scenario 3: Single Active Draft Enforcement', async () => {
    const generateUseCase = new GenerateProposalUseCase(bookRepo, teacherRepo, studentRepo, classRepo, proposalRepo, engine);
    await generateUseCase.execute({ date: '2023-10-10', config });

    // Attempting second generation should fail
    await expect(generateUseCase.execute({ date: '2023-10-11', config }))
      .rejects.toThrow(/A draft proposal already exists/);
  });

  it('Scenario 4: Commit/Archive/Edit Protection on non-draft proposals', async () => {
    const generateUseCase = new GenerateProposalUseCase(bookRepo, teacherRepo, studentRepo, classRepo, proposalRepo, engine);
    const generated = await generateUseCase.execute({ date: '2023-10-10', config });

    const commitUseCase = new CommitProposalUseCase(proposalRepo);
    await commitUseCase.execute(generated.id);

    // Cannot commit again
    await expect(commitUseCase.execute(generated.id)).rejects.toThrow(/already committed/);

    // Cannot archive committed proposal
    const archiveUseCase = new ArchiveProposalUseCase(proposalRepo);
    await expect(archiveUseCase.execute(generated.id)).rejects.toThrow(/Only Draft proposals may be archived/);
  });
});
