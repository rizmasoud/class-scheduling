import { getDatabase } from '@/core/database';
import { BookRepository } from '@/infrastructure/repositories/book.repository';
import { ClassRepository } from '@/infrastructure/repositories/class.repository';
import { ExamRepository } from '@/infrastructure/repositories/exam.repository';
import { ProposalRepository } from '@/infrastructure/repositories/proposal.repository';
import { StudentRepository } from '@/infrastructure/repositories/student.repository';
import { TeacherRepository } from '@/infrastructure/repositories/teacher.repository';
import { GetActiveTeachersUseCase } from '@/application/use-cases/teachers/get-active-teachers.use-case';
import { GetTeacherByIdUseCase } from '@/application/use-cases/teachers/get-teacher-by-id.use-case';
import { ArchiveTeacherUseCase } from '@/application/use-cases/teachers/archive-teacher.use-case';
import { GetAllTeachersUseCase } from '@/application/use-cases/teachers/get-all-teachers.use-case';
import { UpdateTeacherUseCase } from '@/application/use-cases/teachers/update-teacher.use-case';
import { CreateTeacherUseCase } from '@/application/use-cases/teachers/create-teacher.use-case';
import { CommitProposalUseCase } from '@/application/use-cases/proposals/commit-proposal.use-case';
import { RejectProposalUseCase } from '@/application/use-cases/proposals/reject-proposal.use-case';
import { ArchiveProposalUseCase } from '@/application/use-cases/proposals/archive-proposal.use-case';
import { GetProposalByIdUseCase } from '@/application/use-cases/proposals/get-proposal-by-id.use-case';
import { CreateProposalUseCase } from '@/application/use-cases/proposals/create-proposal.use-case';
import { UpdateProposalUseCase } from '@/application/use-cases/proposals/update-proposal.use-case';
import { GetAllProposalsUseCase } from '@/application/use-cases/proposals/get-all-proposals.use-case';
import { ApproveProposalUseCase } from '@/application/use-cases/proposals/approve-proposal.use-case';
import { GenerateProposalUseCase } from '@/application/use-cases/proposals/generate-proposal.use-case';
import { TimeSlotGenerator } from '@/domain/services/scheduling-engine/pipeline/time-slot-generator';
import { CandidateGenerator } from '@/domain/services/scheduling-engine/pipeline/candidate-generator';
import { RuleEngine } from '@/domain/services/scheduling-engine/rules/rule-engine';
import { Optimizer } from '@/domain/services/scheduling-engine/pipeline/optimizer';
import { ProposalAssembler } from '@/domain/services/scheduling-engine/pipeline/proposal-assembler';
import { SchedulingEngine } from '@/domain/services/scheduling-engine/scheduling-engine';
import { CapacityLimitRule } from '@/domain/services/scheduling-engine/rules/hard-rules/capacity-limit.rule';
import { StudentDoubleBookingRule } from '@/domain/services/scheduling-engine/rules/hard-rules/student-double-booking.rule';
import { TeacherBookCompatibilityRule } from '@/domain/services/scheduling-engine/rules/hard-rules/teacher-book-compatibility.rule';
import { TeacherTimeConflictRule } from '@/domain/services/scheduling-engine/rules/hard-rules/teacher-time-conflict.rule';
import { BalancedDistributionRule } from '@/domain/services/scheduling-engine/rules/soft-rules/balanced-distribution.rule';
import { OptimalCapacityRule } from '@/domain/services/scheduling-engine/rules/soft-rules/optimal-capacity.rule';
import { TeacherExperienceRule } from '@/domain/services/scheduling-engine/rules/soft-rules/teacher-experience.rule';
import { TeacherPreferenceRule } from '@/domain/services/scheduling-engine/rules/soft-rules/teacher-preference.rule';
import { GetActiveProposalsUseCase } from '@/application/use-cases/proposals/get-active-proposals.use-case';
import { GetActiveBooksUseCase } from '@/application/use-cases/books/get-active-books.use-case';
import { GetAllBooksUseCase } from '@/application/use-cases/books/get-all-books.use-case';
import { ArchiveBookUseCase } from '@/application/use-cases/books/archive-book.use-case';
import { CreateBookUseCase } from '@/application/use-cases/books/create-book.use-case';
import { UpdateBookUseCase } from '@/application/use-cases/books/update-book.use-case';
import { GetBookByIdUseCase } from '@/application/use-cases/books/get-book-by-id.use-case';
import { CreateClassUseCase } from '@/application/use-cases/classes/create-class.use-case';
import { GetAllClassesUseCase } from '@/application/use-cases/classes/get-all-classes.use-case';
import { UpdateClassUseCase } from '@/application/use-cases/classes/update-class.use-case';
import { GetActiveClassesUseCase } from '@/application/use-cases/classes/get-active-classes.use-case';
import { ArchiveClassUseCase } from '@/application/use-cases/classes/archive-class.use-case';
import { GetClassByIdUseCase } from '@/application/use-cases/classes/get-class-by-id.use-case';
import { GetActiveStudentsUseCase } from '@/application/use-cases/students/get-active-students.use-case';
import { GetAllStudentsUseCase } from '@/application/use-cases/students/get-all-students.use-case';
import { UpdateStudentUseCase } from '@/application/use-cases/students/update-student.use-case';
import { GetStudentByIdUseCase } from '@/application/use-cases/students/get-student-by-id.use-case';
import { CreateStudentUseCase } from '@/application/use-cases/students/create-student.use-case';
import { ArchiveStudentUseCase } from '@/application/use-cases/students/archive-student.use-case';
import { PromoteStudentUseCase } from '@/application/use-cases/students/promote-student.use-case';
import { EnrollStudentUseCase } from '@/application/use-cases/enrollments/enroll-student.use-case';
import { UnenrollStudentUseCase } from '@/application/use-cases/enrollments/unenroll-student.use-case';
import { MoveStudentBetweenClassesUseCase } from '@/application/use-cases/enrollments/move-student-between-classes.use-case';
import { GetAllExamsUseCase } from '@/application/use-cases/exams/get-all-exams.use-case';
import { UpdateExamUseCase } from '@/application/use-cases/exams/update-exam.use-case';
import { CreateExamUseCase } from '@/application/use-cases/exams/create-exam.use-case';
import { GetExamByIdUseCase } from '@/application/use-cases/exams/get-exam-by-id.use-case';
import { MoveStudentBetweenProposalClassesUseCase } from '@/application/use-cases/proposals/manual-editing/move-student.use-case';
import { AddStudentToProposalClassUseCase } from '@/application/use-cases/proposals/manual-editing/add-student.use-case';
import { RemoveStudentFromProposalClassUseCase } from '@/application/use-cases/proposals/manual-editing/remove-student.use-case';
import { SwapStudentsBetweenProposalClassesUseCase } from '@/application/use-cases/proposals/manual-editing/swap-students.use-case';
import { AssignTeacherToProposalClassUseCase } from '@/application/use-cases/proposals/manual-editing/assign-teacher.use-case';
import { ChangeProposalClassScheduleUseCase } from '@/application/use-cases/proposals/manual-editing/change-schedule.use-case';
import { ManualProposalEditor } from '@/domain/services/manual-editing/manual-proposal-editor';


export interface AppContainer {
  getActiveTeachersUseCase: GetActiveTeachersUseCase;
  getTeacherByIdUseCase: GetTeacherByIdUseCase;
  archiveTeacherUseCase: ArchiveTeacherUseCase;
  getAllTeachersUseCase: GetAllTeachersUseCase;
  updateTeacherUseCase: UpdateTeacherUseCase;
  createTeacherUseCase: CreateTeacherUseCase;
  commitProposalUseCase: CommitProposalUseCase;
  rejectProposalUseCase: RejectProposalUseCase;
  archiveProposalUseCase: ArchiveProposalUseCase;
  getProposalByIdUseCase: GetProposalByIdUseCase;
  createProposalUseCase: CreateProposalUseCase;
  updateProposalUseCase: UpdateProposalUseCase;
  getAllProposalsUseCase: GetAllProposalsUseCase;
  approveProposalUseCase: ApproveProposalUseCase;
  generateProposalUseCase: GenerateProposalUseCase;
  getActiveProposalsUseCase: GetActiveProposalsUseCase;
  getActiveBooksUseCase: GetActiveBooksUseCase;
  getAllBooksUseCase: GetAllBooksUseCase;
  archiveBookUseCase: ArchiveBookUseCase;
  createBookUseCase: CreateBookUseCase;
  updateBookUseCase: UpdateBookUseCase;
  getBookByIdUseCase: GetBookByIdUseCase;
  createClassUseCase: CreateClassUseCase;
  getAllClassesUseCase: GetAllClassesUseCase;
  updateClassUseCase: UpdateClassUseCase;
  getActiveClassesUseCase: GetActiveClassesUseCase;
  archiveClassUseCase: ArchiveClassUseCase;
  getClassByIdUseCase: GetClassByIdUseCase;
  getActiveStudentsUseCase: GetActiveStudentsUseCase;
  getAllStudentsUseCase: GetAllStudentsUseCase;
  updateStudentUseCase: UpdateStudentUseCase;
  getStudentByIdUseCase: GetStudentByIdUseCase;
  createStudentUseCase: CreateStudentUseCase;
  archiveStudentUseCase: ArchiveStudentUseCase;
  enrollStudentUseCase: EnrollStudentUseCase;
  unenrollStudentUseCase: UnenrollStudentUseCase;
  moveStudentBetweenClassesUseCase: MoveStudentBetweenClassesUseCase;
  promoteStudentUseCase: PromoteStudentUseCase;
  getAllExamsUseCase: GetAllExamsUseCase;
  updateExamUseCase: UpdateExamUseCase;
  createExamUseCase: CreateExamUseCase;
  getExamByIdUseCase: GetExamByIdUseCase;
  moveStudentBetweenProposalClassesUseCase: MoveStudentBetweenProposalClassesUseCase;
  addStudentToProposalClassUseCase: AddStudentToProposalClassUseCase;
  removeStudentFromProposalClassUseCase: RemoveStudentFromProposalClassUseCase;
  swapStudentsBetweenProposalClassesUseCase: SwapStudentsBetweenProposalClassesUseCase;
  assignTeacherToProposalClassUseCase: AssignTeacherToProposalClassUseCase;
  changeProposalClassScheduleUseCase: ChangeProposalClassScheduleUseCase;
}

let containerInstance: AppContainer | null = null;

export const initContainer = async (): Promise<AppContainer> => {
  if (containerInstance) return containerInstance;

  const db = await getDatabase();

  // Repositories
  const bookRepository = new BookRepository(db);
  const classRepository = new ClassRepository(db);
  const examRepository = new ExamRepository(db);
  const proposalRepository = new ProposalRepository(db);
  const studentRepository = new StudentRepository(db);
  const teacherRepository = new TeacherRepository(db);

  // Use Cases
  const getActiveTeachersUseCase = new GetActiveTeachersUseCase(teacherRepository);
  const getTeacherByIdUseCase = new GetTeacherByIdUseCase(teacherRepository);
  const archiveTeacherUseCase = new ArchiveTeacherUseCase(teacherRepository);
  const getAllTeachersUseCase = new GetAllTeachersUseCase(teacherRepository);
  const updateTeacherUseCase = new UpdateTeacherUseCase(teacherRepository);
  const createTeacherUseCase = new CreateTeacherUseCase(teacherRepository);
  const commitProposalUseCase = new CommitProposalUseCase(proposalRepository);
  const rejectProposalUseCase = new RejectProposalUseCase(proposalRepository);
  const archiveProposalUseCase = new ArchiveProposalUseCase(proposalRepository);
  const getProposalByIdUseCase = new GetProposalByIdUseCase(proposalRepository);
  const createProposalUseCase = new CreateProposalUseCase(proposalRepository);
  const updateProposalUseCase = new UpdateProposalUseCase(proposalRepository);
  const getAllProposalsUseCase = new GetAllProposalsUseCase(proposalRepository);
  const approveProposalUseCase = new ApproveProposalUseCase(proposalRepository);
  // Scheduling Engine Dependencies
  const timeSlotGenerator = new TimeSlotGenerator();
  const candidateGenerator = new CandidateGenerator();
  const ruleEngine = new RuleEngine([
    new CapacityLimitRule(),
    new StudentDoubleBookingRule(),
    new TeacherBookCompatibilityRule(),
    new TeacherTimeConflictRule(),
    new BalancedDistributionRule(),
    new OptimalCapacityRule(),
    new TeacherExperienceRule(),
    new TeacherPreferenceRule()
  ]);
  const optimizer = new Optimizer();
  const proposalAssembler = new ProposalAssembler();
  
  const schedulingEngine = new SchedulingEngine(
    timeSlotGenerator,
    candidateGenerator,
    ruleEngine,
    optimizer,
    proposalAssembler
  );

  const generateProposalUseCase = new GenerateProposalUseCase(bookRepository, teacherRepository, studentRepository, classRepository, proposalRepository, schedulingEngine);
  const getActiveProposalsUseCase = new GetActiveProposalsUseCase(proposalRepository);
  const getActiveBooksUseCase = new GetActiveBooksUseCase(bookRepository);
  const getAllBooksUseCase = new GetAllBooksUseCase(bookRepository);
  const archiveBookUseCase = new ArchiveBookUseCase(bookRepository);
  const createBookUseCase = new CreateBookUseCase(bookRepository);
  const updateBookUseCase = new UpdateBookUseCase(bookRepository);
  const getBookByIdUseCase = new GetBookByIdUseCase(bookRepository);
  const createClassUseCase = new CreateClassUseCase(classRepository);
  const getAllClassesUseCase = new GetAllClassesUseCase(classRepository);
  const updateClassUseCase = new UpdateClassUseCase(classRepository);
  const getActiveClassesUseCase = new GetActiveClassesUseCase(classRepository);
  const archiveClassUseCase = new ArchiveClassUseCase(classRepository);
  const getClassByIdUseCase = new GetClassByIdUseCase(classRepository);
  const getActiveStudentsUseCase = new GetActiveStudentsUseCase(studentRepository);
  const getAllStudentsUseCase = new GetAllStudentsUseCase(studentRepository);
  const updateStudentUseCase = new UpdateStudentUseCase(studentRepository);
  const getStudentByIdUseCase = new GetStudentByIdUseCase(studentRepository);
  const createStudentUseCase = new CreateStudentUseCase(studentRepository);
  const archiveStudentUseCase = new ArchiveStudentUseCase(studentRepository);
  const enrollStudentUseCase = new EnrollStudentUseCase(classRepository, studentRepository);
  const unenrollStudentUseCase = new UnenrollStudentUseCase(classRepository);
  const moveStudentBetweenClassesUseCase = new MoveStudentBetweenClassesUseCase(classRepository, studentRepository);
  const promoteStudentUseCase = new PromoteStudentUseCase(
    db,
    (tx) => new StudentRepository(tx),
    (tx) => new ClassRepository(tx),
    bookRepository,
    examRepository
  );
  const getAllExamsUseCase = new GetAllExamsUseCase(examRepository);
  const updateExamUseCase = new UpdateExamUseCase(examRepository);
  const createExamUseCase = new CreateExamUseCase(examRepository);
  const getExamByIdUseCase = new GetExamByIdUseCase(examRepository);
  const manualProposalEditor = new ManualProposalEditor(ruleEngine);
  const moveStudentBetweenProposalClassesUseCase = new MoveStudentBetweenProposalClassesUseCase(proposalRepository, bookRepository, teacherRepository, studentRepository, classRepository, manualProposalEditor);
  const addStudentToProposalClassUseCase = new AddStudentToProposalClassUseCase(proposalRepository, bookRepository, teacherRepository, studentRepository, classRepository, manualProposalEditor);
  const removeStudentFromProposalClassUseCase = new RemoveStudentFromProposalClassUseCase(proposalRepository, bookRepository, teacherRepository, studentRepository, classRepository, manualProposalEditor);
  const swapStudentsBetweenProposalClassesUseCase = new SwapStudentsBetweenProposalClassesUseCase(proposalRepository, bookRepository, teacherRepository, studentRepository, classRepository, manualProposalEditor);
  const assignTeacherToProposalClassUseCase = new AssignTeacherToProposalClassUseCase(proposalRepository, bookRepository, teacherRepository, studentRepository, classRepository, manualProposalEditor);
  const changeProposalClassScheduleUseCase = new ChangeProposalClassScheduleUseCase(proposalRepository, bookRepository, teacherRepository, studentRepository, classRepository, manualProposalEditor);


  containerInstance = {
    getActiveTeachersUseCase,
    getTeacherByIdUseCase,
    archiveTeacherUseCase,
    getAllTeachersUseCase,
    updateTeacherUseCase,
    createTeacherUseCase,
    commitProposalUseCase,
    rejectProposalUseCase,
    archiveProposalUseCase,
    getProposalByIdUseCase,
    createProposalUseCase,
    updateProposalUseCase,
    getAllProposalsUseCase,
    approveProposalUseCase,
    generateProposalUseCase,
    getActiveProposalsUseCase,
    getActiveBooksUseCase,
    getAllBooksUseCase,
    archiveBookUseCase,
    createBookUseCase,
    updateBookUseCase,
    getBookByIdUseCase,
    createClassUseCase,
    getAllClassesUseCase,
    updateClassUseCase,
    getActiveClassesUseCase,
    archiveClassUseCase,
    getClassByIdUseCase,
    getActiveStudentsUseCase,
    getAllStudentsUseCase,
    updateStudentUseCase,
    getStudentByIdUseCase,
    createStudentUseCase,
    archiveStudentUseCase,
    enrollStudentUseCase,
    unenrollStudentUseCase,
    moveStudentBetweenClassesUseCase,
    promoteStudentUseCase,
    getAllExamsUseCase,
    updateExamUseCase,
    createExamUseCase,
    getExamByIdUseCase,
    moveStudentBetweenProposalClassesUseCase,
    addStudentToProposalClassUseCase,
    removeStudentFromProposalClassUseCase,
    swapStudentsBetweenProposalClassesUseCase,
    assignTeacherToProposalClassUseCase,
    changeProposalClassScheduleUseCase,
  };

  return containerInstance;
};

export const getContainer = (): AppContainer => {
  if (!containerInstance) {
    throw new Error('Container not initialized. Call initContainer first.');
  }
  return containerInstance;
};
