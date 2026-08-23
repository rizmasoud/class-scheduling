import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

// Import repositories
import { BookRepository } from '@/infrastructure/repositories/book.repository';
import { TeacherRepository } from '@/infrastructure/repositories/teacher.repository';
import { StudentRepository } from '@/infrastructure/repositories/student.repository';
import { ClassRepository } from '@/infrastructure/repositories/class.repository';
import { ProposalRepository } from '@/infrastructure/repositories/proposal.repository';

// Import use cases
import { ImportStudentsUseCase } from '@/application/use-cases/students/import-students.use-case';
import { GenerateProposalUseCase } from '@/application/use-cases/proposals/generate-proposal.use-case';
import { UpdateProposalUseCase } from '@/application/use-cases/proposals/update-proposal.use-case';
import { ApproveProposalUseCase } from '@/application/use-cases/proposals/approve-proposal.use-case';

// Import scheduling engine
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
import { BalancedDistributionRule } from '@/domain/services/scheduling-engine/rules/soft-rules/balanced-distribution.rule';
import { OptimalCapacityRule } from '@/domain/services/scheduling-engine/rules/soft-rules/optimal-capacity.rule';
import { TeacherExperienceRule } from '@/domain/services/scheduling-engine/rules/soft-rules/teacher-experience.rule';
import { TeacherPreferenceRule } from '@/domain/services/scheduling-engine/rules/soft-rules/teacher-preference.rule';
import { SchedulingEngineConfig } from '@/domain/services/scheduling-engine/config/scheduling-engine.config';

import * as schema from '@/core/database/schema';

async function run() {
  try {
    const client = createClient({ url: 'file:local.db' });
    const db = drizzle(client, { schema });

    const bookRepo = new BookRepository(db as any);
    const teacherRepo = new TeacherRepository(db as any);
    const studentRepo = new StudentRepository(db as any);
    const classRepo = new ClassRepository(db as any);
    const proposalRepo = new ProposalRepository(db as any);

    // clear all data to avoid constraint issues during rerun
    await client.execute('DELETE FROM class_students');
    await client.execute('DELETE FROM class_schedules');
    await client.execute('DELETE FROM classes');
    await client.execute('DELETE FROM proposal_unscheduled_students');
    await client.execute('DELETE FROM proposal_class_schedules');
    await client.execute('DELETE FROM proposal_classes');
    await client.execute('DELETE FROM scheduling_proposals');
    await client.execute('DELETE FROM students');
    await client.execute('DELETE FROM teachers');
    await client.execute('DELETE FROM books');
    await client.execute('DELETE FROM student_preferences');
    await client.execute('DELETE FROM teacher_preferences');
    await client.execute('DELETE FROM teacher_skills');
    await client.execute('DELETE FROM teacher_attendance');
    await client.execute('DELETE FROM exam_results');


    const importStudentsUseCase = new ImportStudentsUseCase(studentRepo, bookRepo);

    // Setup initial data
    console.log("Seeding books & teachers...");
    await bookRepo.save({ id: 'b-1', name: 'Math 101', level: 1, sequenceOrder: 1, sessionCount: 1 } as any);
    await bookRepo.save({ id: 'b-2', name: 'Science 101', level: 1, sequenceOrder: 2, sessionCount: 1 } as any);
    
    await teacherRepo.save({ 
      id: 't-1', fullName: 'Alice', status: 'Active', availability: [], maxSessionsPerWeek: 100, preferences: null,
      skills: [{ id: 'sk1', teacherId: 't-1', bookId: 'b-1' }, { id: 'sk2', teacherId: 't-1', bookId: 'b-2' }]
    } as any);
    
    await teacherRepo.save({ 
      id: 't-2', fullName: 'Bob', status: 'Active', availability: [], maxSessionsPerWeek: 100, preferences: null,
      skills: [{ id: 'sk3', teacherId: 't-2', bookId: 'b-1' }, { id: 'sk4', teacherId: 't-2', bookId: 'b-2' }]
    } as any);


    console.log("Generating 400 students...");
    const rows = [];
    for (let i = 0; i < 400; i++) {
      rows.push({
        fullName: `Student ${i}`,
        currentBookName: i % 2 === 0 ? 'Math 101' : 'Science 101',
        availableDayPattern: i % 3 === 0 ? 'Odd' : (i % 3 === 1 ? 'Even' : 'Both')
      });
    }

    console.log("Executing CSV Import...");
    const importStart = Date.now();
    const importResult = await importStudentsUseCase.execute(rows, false);
    const importTime = Date.now() - importStart;
    console.log(`Import time: ${importTime}ms`);
    console.log(`Import results: imported=${importResult.importedCount}, dups=${importResult.duplicateCount}, invalid=${importResult.invalidCount}, missing_books=${importResult.missingBooksCount}`);

    // Verify no duplicates
    const allStudents = await studentRepo.findAllActive();
    console.log(`Total students in DB: ${allStudents.length}`);

    // Proposal Generation
    const engine = new SchedulingEngine(
      new TimeSlotGenerator(),
      new CandidateGenerator(),
      new RuleEngine([
        new CapacityLimitRule(),
        new StudentDoubleBookingRule(),
        new TeacherBookCompatibilityRule(),
        new TeacherTimeConflictRule(),
        new BalancedDistributionRule(),
        new OptimalCapacityRule(),
        new TeacherExperienceRule(),
        new TeacherPreferenceRule()
      ]),
      new Optimizer(new RuleEngine([])),
      new ProposalAssembler()
    );

    const generateProposalUseCase = new GenerateProposalUseCase(
      bookRepo, teacherRepo, studentRepo, classRepo, proposalRepo, engine
    );

    const config: SchedulingEngineConfig = {
      minimumCapacity: 5,
      preferredCapacity: 10,
      maximumCapacity: 15,
      ruleWeights: {
        teacherPreferenceWeight: 1,
        capacityWeight: 1,
        bookCompatibilityWeight: 1
      },
      timeSlotConfig: {
        allowedDaysOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        instituteHours: {
          openingTime: '08:00',
          closingTime: '20:00'
        },
        classDurationMinutes: 60
      }
    };

    console.log("Executing Generate Proposal...");
    const genStart = Date.now();
    const returnedProposal = await generateProposalUseCase.execute({
      date: '2026-09-01',
      config
    } as any);
    
    // Save manually because if no classes are generated, the use-case doesn't save it!
    let proposalId = returnedProposal.id;
    if (!returnedProposal.classes || returnedProposal.classes.length === 0) {
       console.log("Warning: No classes were generated! Proposal not saved by use-case.");
       const reasons = returnedProposal.unscheduledStudents?.map(us => (us as any).reasons.join(', '));
       const rc = reasons?.reduce((acc: any, reason: any) => {
         acc[reason] = (acc[reason] || 0) + 1;
         return acc;
       }, {});
       console.log(`Unscheduled reasons: ${JSON.stringify(rc)}`);
       return; // Stop if nothing was generated
    }

    const genTime = Date.now() - genStart;
    console.log(`Generation time: ${genTime}ms`);
    console.log(`Generated Proposal ID: ${proposalId}`);

    const proposal = await proposalRepo.findById(proposalId);
    console.log(`Proposal classes: ${proposal?.classes?.length}`);
    console.log(`Proposal unscheduled: ${proposal?.unscheduledStudents?.length}`);

    // Report scheduling stats
    let scheduledStudents = 0;
    proposal?.classes?.forEach(c => scheduledStudents += (c.studentIds?.length || 0));
    let sessions = 0;
    proposal?.classes?.forEach(c => sessions += (c.schedules?.length || 0));
    console.log(`Scheduled students: ${scheduledStudents}`);
    console.log(`Sessions generated: ${sessions}`);

    const unscheduledReasons = proposal?.unscheduledStudents?.map(us => (us as any).reasons.join(', '));
    const reasonCounts = unscheduledReasons?.reduce((acc: any, reason: any) => {
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});
    console.log(`Unscheduled reasons: ${JSON.stringify(reasonCounts)}`);

    console.log("Manual Edit (Update Proposal)...");
    const updateUseCase = new UpdateProposalUseCase(proposalRepo);
    await updateUseCase.execute(proposal!);

    console.log("Committing Proposal...");
    const approveUseCase = new ApproveProposalUseCase(proposalRepo);
    const commitStart = Date.now();
    await approveUseCase.execute(proposalId as any);
    console.log(`Commit time: ${Date.now() - commitStart}ms`);
    console.log("Commit success");

  } catch (err) {
    console.error("Workflow failed with error:", err);
  }
}

run();
