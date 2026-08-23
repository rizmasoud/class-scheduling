import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '@/core/database/schema';
import { BookRepository } from '@/infrastructure/repositories/book.repository';
import { TeacherRepository } from '@/infrastructure/repositories/teacher.repository';
import { StudentRepository } from '@/infrastructure/repositories/student.repository';
import { ClassRepository } from '@/infrastructure/repositories/class.repository';
import { ProposalRepository } from '@/infrastructure/repositories/proposal.repository';
import { SchedulingEngine } from '@/domain/services/scheduling-engine/scheduling-engine';
import { TimeSlotGenerator } from '@/domain/services/scheduling-engine/pipeline/time-slot-generator';
import { CandidateGenerator } from '@/domain/services/scheduling-engine/pipeline/candidate-generator';
import { RuleEngine } from '@/domain/services/scheduling-engine/rules/rule-engine';
import { Optimizer } from '@/domain/services/scheduling-engine/pipeline/optimizer';
import { ProposalAssembler } from '@/domain/services/scheduling-engine/pipeline/proposal-assembler';
import { GenerateProposalUseCase } from '@/application/use-cases/proposals/generate-proposal.use-case';
import { UpdateProposalUseCase } from '@/application/use-cases/proposals/update-proposal.use-case';
import { defaultSchedulingConfig } from '@/config/scheduling.config';
import { CapacityLimitRule } from '@/domain/services/scheduling-engine/rules/hard-rules/capacity-limit.rule';
import { StudentDoubleBookingRule } from '@/domain/services/scheduling-engine/rules/hard-rules/student-double-booking.rule';
import { TeacherBookCompatibilityRule } from '@/domain/services/scheduling-engine/rules/hard-rules/teacher-book-compatibility.rule';
import { TeacherTimeConflictRule } from '@/domain/services/scheduling-engine/rules/hard-rules/teacher-time-conflict.rule';
import { BalancedDistributionRule } from '@/domain/services/scheduling-engine/rules/soft-rules/balanced-distribution.rule';
import { OptimalCapacityRule } from '@/domain/services/scheduling-engine/rules/soft-rules/optimal-capacity.rule';
import { TeacherExperienceRule } from '@/domain/services/scheduling-engine/rules/soft-rules/teacher-experience.rule';
import { TeacherPreferenceRule } from '@/domain/services/scheduling-engine/rules/soft-rules/teacher-preference.rule';

async function run() {
  const client = createClient({ url: 'file:local.db' });
  const db = drizzle(client, { schema });
  const bookRepo = new BookRepository(db as any);
  const teacherRepo = new TeacherRepository(db as any);
  const studentRepo = new StudentRepository(db as any);
  const classRepo = new ClassRepository(db as any);
  const proposalRepo = new ProposalRepository(db as any);

  // Clear existing proposals to be clean
  await client.execute('DELETE FROM scheduling_proposals');
  await client.execute('DELETE FROM proposal_classes');
  await client.execute('DELETE FROM proposal_class_schedules');
  
  // Set session_count to 2 for at least one book to test multi-session
  await client.execute("UPDATE books SET session_count = 2 WHERE id = 'b-1'");

  const ruleEngine = new RuleEngine([
    new CapacityLimitRule(), new StudentDoubleBookingRule(), new TeacherBookCompatibilityRule(),
    new TeacherTimeConflictRule(), new BalancedDistributionRule(), new OptimalCapacityRule(),
    new TeacherExperienceRule(), new TeacherPreferenceRule()
  ]);
  const engine = new SchedulingEngine(
    new TimeSlotGenerator(), new CandidateGenerator(), ruleEngine, new Optimizer(ruleEngine), new ProposalAssembler()
  );
  
  const generateUseCase = new GenerateProposalUseCase(bookRepo, teacherRepo, studentRepo, classRepo, proposalRepo, engine);
  const updateUseCase = new UpdateProposalUseCase(proposalRepo);

  console.log("=== 1. Generating Proposal ===");
  const config = { ...defaultSchedulingConfig, maximumCapacity: 15 };
  const generated = await generateUseCase.execute({ date: '2026-10-01', config } as any);
  
  const proposal = await proposalRepo.findById(generated.id);
  if (!proposal) throw new Error("Proposal not found");

  let totalStudents = 0;
  let totalSchedules = 0;
  proposal.classes?.forEach(c => {
    totalStudents += c.studentIds?.length || 0;
    totalSchedules += c.schedules?.length || 0;
  });

  console.log(`Class count: ${proposal.classes?.length}`);
  console.log(`Scheduled student count: ${totalStudents}`);
  console.log(`Total schedules: ${totalSchedules}`);

  const targetClass = proposal.classes?.find(c => (c.schedules?.length || 0) > 1 && (c.studentIds?.length || 0) > 0);
  if (!targetClass) {
    console.error("No multi-session class with students found!");
    return;
  }

  console.log(`\nSelected Target Class [ID: ${targetClass.id}]`);
  console.log(`- Teacher: ${targetClass.teacherId}`);
  console.log(`- Students: ${targetClass.studentIds?.length}`);
  console.log(`- Schedules: ${targetClass.schedules?.length} (${targetClass.schedules?.map(s => s.weekDay).join(', ')})`);

  console.log("\n=== 2. Partial Update Regression ===");
  await updateUseCase.execute({
    id: proposal.id,
    classes: [{
      id: targetClass.id,
      bookId: targetClass.bookId,
      generatedName: targetClass.generatedName,
      notes: "Updated harmless notes field"
    }]
  });

  const afterPartial = await proposalRepo.findById(proposal.id);
  const updatedClass1 = afterPartial?.classes?.find(c => c.id === targetClass.id);
  console.log(`- Notes updated: ${updatedClass1?.notes === "Updated harmless notes field"}`);
  console.log(`- Original studentIds preserved: ${updatedClass1?.studentIds?.length === targetClass.studentIds?.length}`);
  console.log(`- Original schedules preserved: ${updatedClass1?.schedules?.length === targetClass.schedules?.length}`);
  console.log(`- Teacher preserved: ${updatedClass1?.teacherId === targetClass.teacherId}`);

  console.log("\n=== 3. Explicit Schedule Update ===");
  if (!targetClass.schedules || targetClass.schedules.length < 2) return;
  
  await updateUseCase.execute({
    id: proposal.id,
    classes: [{
      id: targetClass.id,
      bookId: targetClass.bookId,
      generatedName: targetClass.generatedName,
      schedules: [
        { id: targetClass.schedules[0].id, weekDay: 'Friday', startTime: '09:00', endTime: '10:00' },
        { id: targetClass.schedules[1].id, weekDay: 'Thursday', startTime: '15:00', endTime: '16:00' }
      ]
    }]
  });

  const afterExplicit = await proposalRepo.findById(proposal.id);
  const updatedClass2 = afterExplicit?.classes?.find(c => c.id === targetClass.id);
  
  console.log(`- Original studentIds preserved: ${updatedClass2?.studentIds?.length === targetClass.studentIds?.length}`);
  console.log(`- Explicit schedules updated: ${updatedClass2?.schedules?.[0]?.weekDay === 'Friday' && updatedClass2?.schedules?.[1]?.weekDay === 'Thursday'}`);
  console.log(`- Number of schedules remained intact: ${updatedClass2?.schedules?.length === 2}`);
}

run().catch(console.error);
