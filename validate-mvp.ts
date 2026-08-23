import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { readFileSync } from 'fs';

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

import * as schema from '@/core/database/schema';

async function run() {
  try {
    console.log("Setting up in-memory DB...");
    const client = createClient({ url: 'file::memory:' });
    const db = drizzle(client, { schema });
    
    console.log("Running migrations...");
    const m1 = readFileSync('src/core/database/migrations/0000_wild_prowler.sql', 'utf8');
    const m2 = readFileSync('src/core/database/migrations/0001_panoramic_bloodstorm.sql', 'utf8');
    await client.executeMultiple(m1.replace(/--> statement-breakpoint/g, ';'));
    await client.executeMultiple(m2.replace(/--> statement-breakpoint/g, ';'));

    const bookRepo = new BookRepository(db as any);
    const teacherRepo = new TeacherRepository(db as any);
    const studentRepo = new StudentRepository(db as any);
    const classRepo = new ClassRepository(db as any);
    const proposalRepo = new ProposalRepository(db as any);

    // Setup initial data
    console.log("Seeding books & teachers...");
    await bookRepo.save({ id: 'b-1', name: 'Math 101', level: 1, sequenceOrder: 1, sessionCount: 1 } as any);
    await bookRepo.save({ id: 'b-2', name: 'Science 101', level: 1, sequenceOrder: 2, sessionCount: 1 } as any);
    await teacherRepo.save({ id: 't-1', fullName: 'Alice', status: 'Active', availability: [], maxSessionsPerWeek: 10, skills: [], preferences: [] } as any);
    await teacherRepo.save({ id: 't-2', fullName: 'Bob', status: 'Active', availability: [], maxSessionsPerWeek: 10, skills: [], preferences: [] } as any);

    const importStudentsUseCase = new ImportStudentsUseCase(studentRepo, bookRepo);

    console.log("Generating 400 students...");
    const rows = [];
    for (let i = 0; i < 400; i++) {
      rows.push({
        fullName: `Student ${i}`,
        currentBookName: i % 2 === 0 ? 'Math 101' : 'Science 101',
        availableDayPattern: 'Any'
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

    console.log("Executing Generate Proposal...");
    const genStart = Date.now();
    const proposalId = await generateProposalUseCase.execute({
      name: 'Test Proposal',
      targetDate: '2026-09-01'
    });
    const genTime = Date.now() - genStart;
    console.log(`Generation time: ${genTime}ms`);
    console.log(`Generated Proposal ID: ${proposalId}`);

    const proposal = await proposalRepo.findById(proposalId);
    console.log(`Proposal classes: ${proposal?.classes.length}`);
    console.log(`Proposal unscheduled: ${proposal?.unscheduledStudents.length}`);

    // Report scheduling stats
    let scheduledStudents = 0;
    proposal?.classes.forEach(c => scheduledStudents += c.enrollments.length);
    let sessions = 0;
    proposal?.classes.forEach(c => sessions += c.schedules.length);
    console.log(`Scheduled students: ${scheduledStudents}`);
    console.log(`Sessions generated: ${sessions}`);

    const unscheduledReasons = proposal?.unscheduledStudents.map(us => us.reason);
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
    await approveUseCase.execute(proposalId);
    console.log(`Commit time: ${Date.now() - commitStart}ms`);
    console.log("Commit success");

  } catch (err) {
    console.error("Workflow failed with error:", err);
  }
}

run();
