import { describe, it, expect, vi } from 'vitest';
import { MoveStudentBetweenClassesUseCase } from '../move-student-between-classes.use-case';
import { IClassRepository } from '@/domain/repositories/i-class.repository';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';
import { Class, Student, ClassId, StudentId, BookId } from '@/domain/models';

describe('MoveStudentBetweenClassesUseCase', () => {
  it('should successfully move a student between classes', async () => {
    const student: Student = {
      id: 's-1' as StudentId,
      fullName: 'John Doe',
      currentBookId: 'b-1' as BookId,
      notes: null,
    };
    
    const oldClass: Class = {
      id: 'c-old' as ClassId,
      name: 'Class Old',
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
          classId: 'c-old' as ClassId,
          studentId: 's-1' as StudentId,
          enrollmentStatus: 'Active',
          joinedAt: '2022-01-01',
          leftAt: null
        }
      ],
    };

    const newClass: Class = {
      id: 'c-new' as ClassId,
      name: 'Class New',
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
      findById: vi.fn().mockImplementation((id) => {
        if (id === 'c-old') return Promise.resolve(oldClass);
        if (id === 'c-new') return Promise.resolve(newClass);
        return Promise.resolve(null);
      }),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn().mockImplementation((c) => Promise.resolve(c)),
      saveMany: vi.fn().mockImplementation((cs) => Promise.resolve(cs)),
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

    const useCase = new MoveStudentBetweenClassesUseCase(mockClassRepo, mockStudentRepo);
    
    const result = await useCase.execute({
      studentId: 's-1' as StudentId,
      oldClassId: 'c-old' as ClassId,
      newClassId: 'c-new' as ClassId,
      date: '2023-01-01',
    });

    expect(mockClassRepo.findById).toHaveBeenCalledWith('c-old');
    expect(mockClassRepo.findById).toHaveBeenCalledWith('c-new');
    expect(mockStudentRepo.findById).toHaveBeenCalledWith('s-1');
    expect(mockClassRepo.saveMany).toHaveBeenCalledTimes(1);

    expect(result.oldClass.enrollments![0].enrollmentStatus).toBe('Dropped');
    expect(result.oldClass.enrollments![0].leftAt).toBe('2023-01-01');

    expect(result.newClass.enrollments).toHaveLength(1);
    expect(result.newClass.enrollments![0].studentId).toBe('s-1');
    expect(result.newClass.enrollments![0].enrollmentStatus).toBe('Active');
  });
});
