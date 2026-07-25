import { describe, it, expect, vi } from 'vitest';
import { EnrollStudentUseCase } from '../enroll-student.use-case';
import { IClassRepository } from '@/domain/repositories/i-class.repository';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';
import { Class, Student, ClassId, StudentId, BookId } from '@/domain/models';

describe('EnrollStudentUseCase', () => {
  it('should successfully enroll a student and return the updated class', async () => {
    const student: Student = {
      id: 's-1' as StudentId,
      fullName: 'John Doe',
      currentBookId: 'b-1' as BookId,
      notes: null,
    };
    
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
      enrollments: [],
    };
    
    const updatedClass: Class = {
      ...clazz,
      enrollments: [
        {
          id: 'e-1' as any,
          classId: 'c-1' as ClassId,
          studentId: 's-1' as StudentId,
          enrollmentStatus: 'Active',
          joinedAt: '2023-01-01',
          leftAt: null
        }
      ]
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
    
    const mockStudentRepo: IStudentRepository = {
      findById: vi.fn().mockResolvedValue(student),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
                              archive: vi.fn(),
    };

    const useCase = new EnrollStudentUseCase(mockClassRepo, mockStudentRepo);
    
    const result = await useCase.execute({
      classId: 'c-1' as ClassId,
      studentId: 's-1' as StudentId,
      date: '2023-01-01',
    });

    expect(mockClassRepo.findById).toHaveBeenCalledWith('c-1');
    expect(mockStudentRepo.findById).toHaveBeenCalledWith('s-1');
    expect(mockClassRepo.save).toHaveBeenCalled();
    expect(result.enrollments).toHaveLength(1);
    expect(result.enrollments![0].studentId).toBe('s-1');
    expect(result.enrollments![0].enrollmentStatus).toBe('Active');
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
    
    const mockStudentRepo: IStudentRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
                              archive: vi.fn(),
    };

    const useCase = new EnrollStudentUseCase(mockClassRepo, mockStudentRepo);

    await expect(useCase.execute({
      classId: 'c-1' as ClassId,
      studentId: 's-1' as StudentId,
      date: '2023-01-01',
    })).rejects.toThrow('Class with id c-1 not found');
  });

  it('should throw an error if student does not exist', async () => {
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
      enrollments: [],
    };
    
    const mockClassRepo: IClassRepository = {
      findById: vi.fn().mockResolvedValue(clazz),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
                              saveMany: vi.fn(),
      archive: vi.fn(),
    };
    
    const mockStudentRepo: IStudentRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
                              archive: vi.fn(),
    };

    const useCase = new EnrollStudentUseCase(mockClassRepo, mockStudentRepo);

    await expect(useCase.execute({
      classId: 'c-1' as ClassId,
      studentId: 's-1' as StudentId,
      date: '2023-01-01',
    })).rejects.toThrow('Student with id s-1 not found');
  });
});
