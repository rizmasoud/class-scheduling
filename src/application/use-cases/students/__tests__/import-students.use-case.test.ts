import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportStudentsUseCase, ImportStudentRow } from '../import-students.use-case';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';
import { IBookRepository } from '@/domain/repositories/i-book.repository';
import { BookId, StudentId } from '@/domain/models';

describe('ImportStudentsUseCase', () => {
  const mockStudentRepo = {
    findAllActive: vi.fn(), save: vi.fn(), saveMany: vi.fn(), 
    
  } as unknown as IStudentRepository;

  const mockBookRepo = {
    findAllActive: vi.fn(), save: vi.fn(), saveMany: vi.fn(), 
  } as unknown as IBookRepository;

  const useCase = new ImportStudentsUseCase(mockStudentRepo, mockBookRepo);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully validate and batch import valid rows', async () => {
    vi.mocked(mockBookRepo.findAllActive).mockResolvedValue([
      { id: 'b1' as BookId, name: 'Level 1', level: 1, sequenceOrder: 1, sessionCount: 1 }
    ]);
    vi.mocked(mockStudentRepo.findAllActive).mockResolvedValue([]);

    const rows: ImportStudentRow[] = [
      { fullName: 'John Doe', currentBookName: 'Level 1', availableDayPattern: 'Odd' },
      { fullName: 'Jane Smith', currentBookName: 'Level 1', availableDayPattern: 'Even' }
    ];

    const result = await useCase.execute(rows, false);

    expect(result.importedCount).toBe(2);
    expect(result.duplicateCount).toBe(0);
    expect(result.invalidCount).toBe(0);
    expect(result.missingBooksCount).toBe(0);
    expect(result.validRows).toHaveLength(2);
    expect(mockStudentRepo.saveMany).toHaveBeenCalledTimes(1);
    
    // Check that saveMany received 2 students
    const savedStudents = vi.mocked(mockStudentRepo.saveMany!).mock.calls[0][0];
    expect(savedStudents).toHaveLength(2);
    expect(savedStudents[0].fullName).toBe('John Doe');
    expect(savedStudents[0].currentBookId).toBe('b1');
  });

  it('should detect duplicate students and missing books', async () => {
    vi.mocked(mockBookRepo.findAllActive).mockResolvedValue([
      { id: 'b1' as BookId, name: 'Level 1', level: 1, sequenceOrder: 1, sessionCount: 1 }
    ]);
    vi.mocked(mockStudentRepo.findAllActive).mockResolvedValue([
      { id: 's1' as StudentId, fullName: 'Existing Student', currentBookId: 'b1' as BookId, notes: null }
    ]);

    const rows: ImportStudentRow[] = [
      { fullName: 'Existing Student', currentBookName: 'Level 1', availableDayPattern: 'Odd' }, // Duplicate
      { fullName: 'New Student', currentBookName: 'Unknown Book', availableDayPattern: 'Odd' }, // Missing book
    ];

    const result = await useCase.execute(rows, false);

    expect(result.importedCount).toBe(0);
    expect(result.duplicateCount).toBe(1);
    expect(result.missingBooksCount).toBe(1);
    expect(result.errors).toContain("Row 1: Student 'Existing Student' already exists (likely duplicate)");
    expect(result.errors).toContain("Row 2: Book 'Unknown Book' not found");
    expect(mockStudentRepo.saveMany).not.toHaveBeenCalled();
  });

  it('should detect invalid day patterns or missing fields', async () => {
    vi.mocked(mockBookRepo.findAllActive).mockResolvedValue([
      { id: 'b1' as BookId, name: 'Level 1', level: 1, sequenceOrder: 1, sessionCount: 1 }
    ]);
    vi.mocked(mockStudentRepo.findAllActive).mockResolvedValue([]);

    const rows: ImportStudentRow[] = [
      { fullName: 'Alice', currentBookName: 'Level 1', availableDayPattern: 'Wrong' }, // Invalid pattern
      { fullName: '', currentBookName: 'Level 1', availableDayPattern: 'Odd' }, // Missing name
    ];

    const result = await useCase.execute(rows, false);

    expect(result.importedCount).toBe(0);
    expect(result.invalidCount).toBe(2);
    expect(mockStudentRepo.saveMany).not.toHaveBeenCalled();
  });
  
  it('should prevent duplicates within the CSV itself', async () => {
    vi.mocked(mockBookRepo.findAllActive).mockResolvedValue([
      { id: 'b1' as BookId, name: 'Level 1', level: 1, sequenceOrder: 1, sessionCount: 1 }
    ]);
    vi.mocked(mockStudentRepo.findAllActive).mockResolvedValue([]);

    const rows: ImportStudentRow[] = [
      { fullName: 'Alice', currentBookName: 'Level 1', availableDayPattern: 'Odd' },
      { fullName: 'Alice', currentBookName: 'Level 1', availableDayPattern: 'Even' }, // Duplicate within CSV
    ];

    const result = await useCase.execute(rows, false);

    expect(result.importedCount).toBe(1);
    expect(result.duplicateCount).toBe(1);
    expect(mockStudentRepo.saveMany).toHaveBeenCalled(); // Should save the first one
  });

  it('should return valid rows on dry run without saving', async () => {
    vi.mocked(mockBookRepo.findAllActive).mockResolvedValue([
      { id: 'b1' as BookId, name: 'Level 1', level: 1, sequenceOrder: 1, sessionCount: 1 }
    ]);
    vi.mocked(mockStudentRepo.findAllActive).mockResolvedValue([]);

    const rows: ImportStudentRow[] = [
      { fullName: 'Alice', currentBookName: 'Level 1', availableDayPattern: 'Odd' }
    ];

    const result = await useCase.execute(rows, true); // dryRun = true

    expect(result.importedCount).toBe(0);
    expect(result.validRows).toHaveLength(1);
    expect(mockStudentRepo.saveMany).not.toHaveBeenCalled();
  });
});
