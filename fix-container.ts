import fs from 'fs';

const path = 'src/app/container.ts';
let code = fs.readFileSync(path, 'utf8');

// Imports
const manualEditImports = `
import { MoveStudentBetweenProposalClassesUseCase } from '@/application/use-cases/proposals/manual-editing/move-student.use-case';
import { AddStudentToProposalClassUseCase } from '@/application/use-cases/proposals/manual-editing/add-student.use-case';
import { RemoveStudentFromProposalClassUseCase } from '@/application/use-cases/proposals/manual-editing/remove-student.use-case';
import { SwapStudentsBetweenProposalClassesUseCase } from '@/application/use-cases/proposals/manual-editing/swap-students.use-case';
import { AssignTeacherToProposalClassUseCase } from '@/application/use-cases/proposals/manual-editing/assign-teacher.use-case';
import { ChangeProposalClassScheduleUseCase } from '@/application/use-cases/proposals/manual-editing/change-schedule.use-case';
import { ManualProposalEditor } from '@/domain/services/manual-editing/manual-proposal-editor';
`;

code = code.replace(/import { GetExamByIdUseCase } from '@\/application\/use-cases\/exams\/get-exam-by-id.use-case';/, 
  "import { GetExamByIdUseCase } from '@/application/use-cases/exams/get-exam-by-id.use-case';" + manualEditImports
);

// AppContainer
const manualEditInterface = `
  moveStudentBetweenProposalClassesUseCase: MoveStudentBetweenProposalClassesUseCase;
  addStudentToProposalClassUseCase: AddStudentToProposalClassUseCase;
  removeStudentFromProposalClassUseCase: RemoveStudentFromProposalClassUseCase;
  swapStudentsBetweenProposalClassesUseCase: SwapStudentsBetweenProposalClassesUseCase;
  assignTeacherToProposalClassUseCase: AssignTeacherToProposalClassUseCase;
  changeProposalClassScheduleUseCase: ChangeProposalClassScheduleUseCase;
`;
code = code.replace(/  getExamByIdUseCase: GetExamByIdUseCase;\n}/, 
  "  getExamByIdUseCase: GetExamByIdUseCase;" + manualEditInterface + "}"
);

// Initialization
const manualEditInit = `
  const manualProposalEditor = new ManualProposalEditor(ruleEngine);
  const moveStudentBetweenProposalClassesUseCase = new MoveStudentBetweenProposalClassesUseCase(proposalRepository, bookRepository, teacherRepository, studentRepository, classRepository, manualProposalEditor);
  const addStudentToProposalClassUseCase = new AddStudentToProposalClassUseCase(proposalRepository, bookRepository, teacherRepository, studentRepository, classRepository, manualProposalEditor);
  const removeStudentFromProposalClassUseCase = new RemoveStudentFromProposalClassUseCase(proposalRepository, bookRepository, teacherRepository, studentRepository, classRepository, manualProposalEditor);
  const swapStudentsBetweenProposalClassesUseCase = new SwapStudentsBetweenProposalClassesUseCase(proposalRepository, bookRepository, teacherRepository, studentRepository, classRepository, manualProposalEditor);
  const assignTeacherToProposalClassUseCase = new AssignTeacherToProposalClassUseCase(proposalRepository, bookRepository, teacherRepository, studentRepository, classRepository, manualProposalEditor);
  const changeProposalClassScheduleUseCase = new ChangeProposalClassScheduleUseCase(proposalRepository, bookRepository, teacherRepository, studentRepository, classRepository, manualProposalEditor);
`;
code = code.replace(/  const getExamByIdUseCase = new GetExamByIdUseCase\(examRepository\);/,
  "  const getExamByIdUseCase = new GetExamByIdUseCase(examRepository);" + manualEditInit
);

// Container Instance
const manualEditInstance = `
    moveStudentBetweenProposalClassesUseCase,
    addStudentToProposalClassUseCase,
    removeStudentFromProposalClassUseCase,
    swapStudentsBetweenProposalClassesUseCase,
    assignTeacherToProposalClassUseCase,
    changeProposalClassScheduleUseCase,
`;
code = code.replace(/    getExamByIdUseCase,\n  };/,
  "    getExamByIdUseCase," + manualEditInstance + "  };"
);

fs.writeFileSync(path, code);
