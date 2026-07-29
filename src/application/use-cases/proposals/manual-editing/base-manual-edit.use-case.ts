import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';
import { IBookRepository } from '@/domain/repositories/i-book.repository';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';
import { IClassRepository } from '@/domain/repositories/i-class.repository';
import { SchedulingContext } from '@/domain/services/scheduling-engine/models/scheduling-context';

export class BaseManualEditUseCase {
  constructor(
    protected readonly proposalRepository: IProposalRepository,
    protected readonly bookRepository: IBookRepository,
    protected readonly teacherRepository: ITeacherRepository,
    protected readonly studentRepository: IStudentRepository,
    protected readonly classRepository: IClassRepository
  ) {}

  protected async getContext(): Promise<SchedulingContext> {
    const [activeBooks, activeTeachers, activeStudents, activeClasses] = await Promise.all([
      this.bookRepository.findAllActive(),
      this.teacherRepository.findAllActive(),
      this.studentRepository.findAllActive(),
      this.classRepository.findAllActive(),
    ]);

    return {
      activeBooks,
      activeTeachers,
      activeStudents,
      activeClasses
    };
  }
}
