import { describe, it, expect, vi } from 'vitest';
import { UnenrollStudentUseCase } from '../unenroll-student.use-case';
import { IClassRepository } from '@/domain/repositories/i-class.repository';
import { Class, ClassId, StudentId, BookId } from '@/domain/models';

describe('UnenrollStudentUseCase', () => {
  it('should successfully unenroll a student and return the updated class', async () => {
    const clazz: Class = {
      id: 'c-1' as ClassId,
      name: 'Class 1',
      bookId: 'b-1' as BookId,
      teacherId: null,
      status: 'Active',
      minCapacity: 1,
      targetCapacity: 2,
      maxCapacity: 5,
      notes: null,
      enrollments: [
        {
          id: 'e-1' as any,
          classId: 'c-1' as ClassId,
          studentId: 's-1' as StudentId,
          enrollmentStatus: 'Active',
          joinedAt: '2022-01-01',
          leftAt: null
        }
      ],
    };

    const mockClassRepo: IClassRepository = {
      findById: vi.fn().mockResolvedValue(clazz),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn().mockImplementation((c) => Promise.resolve(c)),
                        saveMany: vi.fn(),
      archive: vi.fn(),
    };
    
    const useCase = new UnenrollStudentUseCase(mockClassRepo);
    
    const result = await useCase.execute({
      classId: 'c-1' as ClassId,
      studentId: 's-1' as StudentId,
      date: '2023-01-01',
    });

    expect(mockClassRepo.findById).toHaveBeenCalledWith('c-1');
    expect(mockClassRepo.save).toHaveBeenCalled();
    expect(result.enrollments).toHaveLength(1);
    expect(result.enrollments![0].enrollmentStatus).toBe('Dropped');
    expect(result.enrollments![0].leftAt).toBe('2023-01-01');
  });

  it('should throw an error if class does not exist', async () => {
    const mockClassRepo: IClassRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
                        saveMany: vi.fn(),
      archive: vi.fn(),
    };
    
    const useCase = new UnenrollStudentUseCase(mockClassRepo);

    await expect(useCase.execute({
      classId: 'c-1' as ClassId,
      studentId: 's-1' as StudentId,
      date: '2023-01-01',
    })).rejects.toThrow('Class with id c-1 not found');
  });
});
