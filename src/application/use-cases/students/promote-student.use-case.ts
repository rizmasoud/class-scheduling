import { StudentId, ExamId } from '@/domain/models';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';
import { IClassRepository } from '@/domain/repositories/i-class.repository';
import { IBookRepository } from '@/domain/repositories/i-book.repository';
import { IExamRepository } from '@/domain/repositories/i-exam.repository';
import { AppDatabase, AppTransaction } from '@/core/database/types';
import { checkPromotionEligibility, findNextBook } from '@/domain/services/promotion.logic';
import { completeStudentEnrollment } from '@/domain/services/enrollment.logic';

export interface PromoteStudentDTO {
  studentId: StudentId;
  examId: ExamId;
  date: string;
}

export class PromoteStudentUseCase {
  constructor(
    private readonly db: AppDatabase,
    private readonly studentRepositoryFactory: (tx: AppTransaction) => IStudentRepository,
    private readonly classRepositoryFactory: (tx: AppTransaction) => IClassRepository,
    private readonly bookRepository: IBookRepository,
    private readonly examRepository: IExamRepository
  ) {}

  async execute(dto: PromoteStudentDTO): Promise<void> {
    const student = await this.studentRepositoryFactory(this.db as any).findById(dto.studentId);
    if (!student) {
      throw new Error(`Student with id ${dto.studentId} not found`);
    }

    const examResult = await this.examRepository.findById(dto.examId);
    if (!examResult) {
      throw new Error(`Exam result with id ${dto.examId} not found`);
    }

    // Verify the exam belongs to an enrollment of this student
    const activeClasses = await this.classRepositoryFactory(this.db as any).findAllActive();
    let currentClass = null;
    for (const clazz of activeClasses) {
      const matchingEnrollment = clazz.enrollments?.find(e => e.id === examResult.classStudentId && e.studentId === student.id);
      if (matchingEnrollment) {
        currentClass = clazz;
        break;
      }
    }

    if (!currentClass) {
      throw new Error('Could not find the associated class enrollment for this exam and student');
    }

    if (!checkPromotionEligibility(examResult)) {
      throw new Error('Student is not eligible for promotion based on exam results');
    }

    const currentBook = await this.bookRepository.findById(student.currentBookId);
    if (!currentBook) {
      throw new Error(`Current book with id ${student.currentBookId} not found`);
    }

    const allBooks = await this.bookRepository.findAllActive();
    const nextBook = findNextBook(currentBook, allBooks);

    const updatedStudent = {
      ...student,
      currentBookId: nextBook.id
    };

    const updatedClass = completeStudentEnrollment(currentClass, student.id, dto.date);

    await this.db.transaction(async (tx) => {
      const txStudentRepo = this.studentRepositoryFactory(tx);
      const txClassRepo = this.classRepositoryFactory(tx);

      await txClassRepo.save(updatedClass);
      await txStudentRepo.save(updatedStudent);
    });
  }
}
