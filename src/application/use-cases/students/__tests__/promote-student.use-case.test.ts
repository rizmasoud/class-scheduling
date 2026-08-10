import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromoteStudentUseCase } from '../promote-student.use-case';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';
import { IClassRepository } from '@/domain/repositories/i-class.repository';
import { IBookRepository } from '@/domain/repositories/i-book.repository';
import { IExamRepository } from '@/domain/repositories/i-exam.repository';
import { Book, Class, ExamResult, Student } from '@/domain/models';

describe('PromoteStudentUseCase', () => {
  let useCase: PromoteStudentUseCase;
  let mockStudentRepo: ReturnType<typeof vi.mocked<IStudentRepository>>;
  let mockClassRepo: ReturnType<typeof vi.mocked<IClassRepository>>;
  let mockBookRepo: ReturnType<typeof vi.mocked<IBookRepository>>;
  let mockExamRepo: ReturnType<typeof vi.mocked<IExamRepository>>;
  let mockDb: any;
  let mockTx: any;

  const book1: Book = { id: 'book-1', name: 'Book 1', level: 1, sequenceOrder: 1, sessionCount: 10 };
  const book2: Book = { id: 'book-2', name: 'Book 2', level: 2, sequenceOrder: 5, sessionCount: 10 };
  
  const student1: Student = { id: 'student-1', fullName: 'John Doe', currentBookId: 'book-1', notes: null };
  const class1: Class = {
    id: 'class-1', name: 'Class 1', bookId: 'book-1', status: 'Active', teacherId: null,
    minCapacity: 1, maxCapacity: 10, targetCapacity: 5, notes: null,
    enrollments: [
      { id: 'enrollment-1', classId: 'class-1', studentId: 'student-1', enrollmentStatus: 'Active', joinedAt: '2023-01-01', leftAt: null }
    ]
  };

  beforeEach(() => {
    mockStudentRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      archive: vi.fn(),
    } as any;
    
    mockClassRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      saveMany: vi.fn(),
      archive: vi.fn(),
    } as any;

    mockBookRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      archive: vi.fn(),
    } as any;

    mockExamRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
    } as any;

    mockTx = {};
    mockDb = {
      transaction: vi.fn().mockImplementation(async (cb) => cb(mockTx))
    };

    useCase = new PromoteStudentUseCase(
      mockDb,
      () => mockStudentRepo,
      () => mockClassRepo,
      mockBookRepo,
      mockExamRepo
    );

    mockStudentRepo.findById.mockResolvedValue(student1);
    mockBookRepo.findById.mockResolvedValue(book1);
    mockBookRepo.findAllActive.mockResolvedValue([book1, book2]);
    mockClassRepo.findAllActive.mockResolvedValue([class1]);
  });

  it('should successfully promote a passed student', async () => {
    const passedExam: ExamResult = { id: 'exam-1', classStudentId: 'enrollment-1', score: 85, resultStatus: 'Passed', supervisorDecision: null, examDate: '2023-05-01', notes: null };
    mockExamRepo.findById.mockResolvedValue(passedExam);
    
    await useCase.execute({ studentId: 'student-1', examId: 'exam-1', date: '2023-06-01' });

    expect(mockClassRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      enrollments: [
        expect.objectContaining({ enrollmentStatus: 'Completed', leftAt: '2023-06-01' })
      ]
    }));
    
    expect(mockStudentRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      currentBookId: 'book-2'
    }));
  });

  it('should successfully promote a conditional student with explicit Promote decision', async () => {
    const conditionalExam: ExamResult = { id: 'exam-1', classStudentId: 'enrollment-1', score: 65, resultStatus: 'Conditional', supervisorDecision: 'Promote', examDate: '2023-05-01', notes: null };
    mockExamRepo.findById.mockResolvedValue(conditionalExam);
    
    await useCase.execute({ studentId: 'student-1', examId: 'exam-1', date: '2023-06-01' });

    expect(mockClassRepo.save).toHaveBeenCalled();
    expect(mockStudentRepo.save).toHaveBeenCalled();
  });

  it('should throw an error for a conditional student without explicit Promote decision', async () => {
    const conditionalExam: ExamResult = { id: 'exam-1', classStudentId: 'enrollment-1', score: 65, resultStatus: 'Conditional', supervisorDecision: null, examDate: '2023-05-01', notes: null };
    mockExamRepo.findById.mockResolvedValue(conditionalExam);
    
    await expect(useCase.execute({ studentId: 'student-1', examId: 'exam-1', date: '2023-06-01' }))
      .rejects.toThrow('Student is not eligible for promotion based on exam results');
  });

  it('should throw an error for a conditional student with MoveToLowerLevel decision', async () => {
    const conditionalExam: ExamResult = { id: 'exam-1', classStudentId: 'enrollment-1', score: 65, resultStatus: 'Conditional', supervisorDecision: 'MoveToLowerLevel', examDate: '2023-05-01', notes: null };
    mockExamRepo.findById.mockResolvedValue(conditionalExam);
    
    await expect(useCase.execute({ studentId: 'student-1', examId: 'exam-1', date: '2023-06-01' }))
      .rejects.toThrow('Student is not eligible for promotion based on exam results');
  });

  it('should throw an error for a failed student', async () => {
    const failedExam: ExamResult = { id: 'exam-1', classStudentId: 'enrollment-1', score: 45, resultStatus: 'Failed', supervisorDecision: null, examDate: '2023-05-01', notes: null };
    mockExamRepo.findById.mockResolvedValue(failedExam);
    
    await expect(useCase.execute({ studentId: 'student-1', examId: 'exam-1', date: '2023-06-01' }))
      .rejects.toThrow('Student is not eligible for promotion based on exam results');
  });

  it('should correctly select the next book based on sequenceOrder, ignoring gaps', async () => {
    const passedExam: ExamResult = { id: 'exam-1', classStudentId: 'enrollment-1', score: 85, resultStatus: 'Passed', supervisorDecision: null, examDate: '2023-05-01', notes: null };
    mockExamRepo.findById.mockResolvedValue(passedExam);
    
    await useCase.execute({ studentId: 'student-1', examId: 'exam-1', date: '2023-06-01' });

    expect(mockStudentRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      currentBookId: 'book-2'
    }));
  });

  it('should throw an error if no next book is available', async () => {
    mockBookRepo.findById.mockResolvedValue(book2);
    const passedExam: ExamResult = { id: 'exam-1', classStudentId: 'enrollment-1', score: 85, resultStatus: 'Passed', supervisorDecision: null, examDate: '2023-05-01', notes: null };
    mockExamRepo.findById.mockResolvedValue(passedExam);
    
    // Make student already at the highest book
    mockStudentRepo.findById.mockResolvedValue({ ...student1, currentBookId: 'book-2' });

    await expect(useCase.execute({ studentId: 'student-1', examId: 'exam-1', date: '2023-06-01' }))
      .rejects.toThrow('No next book available for promotion.');
  });

  it('should throw an error and conceptually roll back if saving updated student fails', async () => {
    const passedExam: ExamResult = { id: 'exam-1', classStudentId: 'enrollment-1', score: 85, resultStatus: 'Passed', supervisorDecision: null, examDate: '2023-05-01', notes: null };
    mockExamRepo.findById.mockResolvedValue(passedExam);
    
    mockStudentRepo.save.mockRejectedValue(new Error('Database error during student update'));

    await expect(useCase.execute({ studentId: 'student-1', examId: 'exam-1', date: '2023-06-01' }))
      .rejects.toThrow('Database error during student update');

    expect(mockClassRepo.save).toHaveBeenCalled();
    expect(mockStudentRepo.save).toHaveBeenCalled();
  });
});
