const fs = require('fs');

const createStudentCode = `import { describe, it, expect, vi } from 'vitest';
import { CreateStudentUseCase } from '../create-student.use-case';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';

describe('CreateStudentUseCase', () => {
  it('should create and save a new student without preference', async () => {
    const mockRepo: IStudentRepository = {
      save: vi.fn().mockImplementation((student) => Promise.resolve(student)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new CreateStudentUseCase(mockRepo);
    
    const result = await useCase.execute({
      fullName: 'John Doe',
      currentBookId: 'book-1',
    });

    expect(result.id).toBeDefined();
    expect(result.fullName).toBe('John Doe');
    expect(result.currentBookId).toBe('book-1');
    expect(result.notes).toBeNull();
    expect(result.preference).toBeNull();
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });

  it('should create and save a new student with preference', async () => {
    const mockRepo: IStudentRepository = {
      save: vi.fn().mockImplementation((student) => Promise.resolve(student)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new CreateStudentUseCase(mockRepo);
    
    const result = await useCase.execute({
      fullName: 'Jane Doe',
      currentBookId: 'book-2',
      preference: {
        availableDayPattern: 'Both'
      }
    });

    expect(result.id).toBeDefined();
    expect(result.fullName).toBe('Jane Doe');
    expect(result.preference).toBeDefined();
    expect(result.preference?.availableDayPattern).toBe('Both');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should create and save a new student with multiple unavailable time ranges', async () => {
    const mockRepo: IStudentRepository = {
      save: vi.fn().mockImplementation((student) => Promise.resolve(student)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),      
      archive: vi.fn(),
    };
    const useCase = new CreateStudentUseCase(mockRepo);
    
    const result = await useCase.execute({
      fullName: 'Time Range Student',
      currentBookId: 'book-3',
      preference: {
        availableDayPattern: 'Both',
        unavailableTimeRanges: ['08:00-10:00', '14:00-16:00']
      }
    });

    expect(result.preference).toBeDefined();
    expect(result.preference?.unavailableTimeRanges).toEqual(['08:00-10:00', '14:00-16:00']);
  });
});
`;

fs.writeFileSync('src/application/use-cases/students/__tests__/create-student.use-case.test.ts', createStudentCode);

const updateStudentCode = `import { describe, it, expect, vi } from 'vitest';
import { UpdateStudentUseCase } from '../update-student.use-case';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';

describe('UpdateStudentUseCase', () => {
  it('should update an existing student', async () => {
    const existingStudent = {
      id: 's-1',
      fullName: 'Old Name',
      currentBookId: 'book-1',
      notes: null,
      preference: null,
    };

    const mockRepo: IStudentRepository = {
      save: vi.fn().mockImplementation((student) => Promise.resolve(student)),
      findById: vi.fn().mockResolvedValue(existingStudent as any),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new UpdateStudentUseCase(mockRepo);
    
    const result = await useCase.execute({
      id: 's-1',
      fullName: 'New Name',
      currentBookId: 'book-2',
      preference: {
        availableDayPattern: 'Odd'
      }
    });

    expect(result.id).toBe('s-1');
    expect(result.fullName).toBe('New Name');
    expect(result.currentBookId).toBe('book-2');
    expect(result.preference).toBeDefined();
    expect(result.preference?.availableDayPattern).toBe('Odd');
    expect(mockRepo.findById).toHaveBeenCalledWith('s-1');
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });

  it('should throw error if student not found', async () => {
    const mockRepo: IStudentRepository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new UpdateStudentUseCase(mockRepo);
    
    await expect(useCase.execute({ id: 's-non-existent' })).rejects.toThrow('Student with id s-non-existent not found');
  });

  it('should clear preference when passing null', async () => {
    const existingStudent = {
      id: 's-1',
      fullName: 'Old Name',
      currentBookId: 'book-1',
      notes: null,
      preference: {
        id: 'pref-1',
        studentId: 's-1',
        availableDayPattern: 'Odd',
        unavailableTimeRanges: null,
        notes: null
      },
    };

    const mockRepo: IStudentRepository = {
      save: vi.fn().mockImplementation((student) => Promise.resolve(student)),
      findById: vi.fn().mockResolvedValue(existingStudent as any),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new UpdateStudentUseCase(mockRepo);
    
    const result = await useCase.execute({
      id: 's-1',
      preference: null
    });

    expect(result.preference).toBeNull();
  });

  it('should update multiple unavailable time ranges', async () => {
    const existingStudent = {
      id: 's-1',
      fullName: 'Old Name',
      currentBookId: 'book-1',
      notes: null,
      preference: null,
    };
    const mockRepo: IStudentRepository = {
      save: vi.fn().mockImplementation((student) => Promise.resolve(student)),
      findById: vi.fn().mockResolvedValue(existingStudent as any),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),      
      archive: vi.fn(),
    };
    const useCase = new UpdateStudentUseCase(mockRepo);
    
    const result = await useCase.execute({
      id: 's-1',
      preference: {
        availableDayPattern: 'Odd',
        unavailableTimeRanges: ['09:00-11:00', '15:00-17:00']
      }
    });

    expect(result.preference?.unavailableTimeRanges).toEqual(['09:00-11:00', '15:00-17:00']);
  });
});
`;

fs.writeFileSync('src/application/use-cases/students/__tests__/update-student.use-case.test.ts', updateStudentCode);

const createTeacherCode = `import { describe, it, expect, vi } from 'vitest';
import { CreateTeacherUseCase } from '../create-teacher.use-case';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';

describe('CreateTeacherUseCase', () => {
  it('should create and save a new teacher without preference and skills', async () => {
    const mockRepo: ITeacherRepository = {
      save: vi.fn().mockImplementation((teacher) => Promise.resolve(teacher)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new CreateTeacherUseCase(mockRepo);
    
    const result = await useCase.execute({
      fullName: 'John Teacher',
    });

    expect(result.id).toBeDefined();
    expect(result.fullName).toBe('John Teacher');
    expect(result.notes).toBeNull();
    expect(result.preference).toBeNull();
    expect(result.skills).toHaveLength(0);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });

  it('should create and save a new teacher with preference and skills', async () => {
    const mockRepo: ITeacherRepository = {
      save: vi.fn().mockImplementation((teacher) => Promise.resolve(teacher)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new CreateTeacherUseCase(mockRepo);
    
    const result = await useCase.execute({
      fullName: 'Jane Teacher',
      preference: {
        maxWeeklySessions: 10
      },
      skills: [
        { bookId: 'book-1' }
      ]
    });

    expect(result.id).toBeDefined();
    expect(result.fullName).toBe('Jane Teacher');
    expect(result.preference).toBeDefined();
    expect(result.preference?.maxWeeklySessions).toBe(10);
    expect(result.skills).toHaveLength(1);
    expect(result.skills?.[0].bookId).toBe('book-1');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should create and save a new teacher with multiple unavailable time ranges', async () => {
    const mockRepo: ITeacherRepository = {
      save: vi.fn().mockImplementation((teacher) => Promise.resolve(teacher)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),      
      archive: vi.fn(),
    };
    const useCase = new CreateTeacherUseCase(mockRepo);
    
    const result = await useCase.execute({
      fullName: 'Time Range Teacher',
      preference: {
        unavailableTimeRanges: ['10:00-12:00', '16:00-18:00']
      }
    });

    expect(result.preference).toBeDefined();
    expect(result.preference?.unavailableTimeRanges).toEqual(['10:00-12:00', '16:00-18:00']);
  });
});
`;
fs.writeFileSync('src/application/use-cases/teachers/__tests__/create-teacher.use-case.test.ts', createTeacherCode);

const updateTeacherCode = `import { describe, it, expect, vi } from 'vitest';
import { UpdateTeacherUseCase } from '../update-teacher.use-case';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';

describe('UpdateTeacherUseCase', () => {
  it('should update an existing teacher', async () => {
    const existingTeacher = {
      id: 't-1',
      fullName: 'Old Name',
      notes: null,
      preference: null,
      skills: [],
    };

    const mockRepo: ITeacherRepository = {
      save: vi.fn().mockImplementation((teacher) => Promise.resolve(teacher)),
      findById: vi.fn().mockResolvedValue(existingTeacher as any),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new UpdateTeacherUseCase(mockRepo);
    
    const result = await useCase.execute({
      id: 't-1',
      fullName: 'New Name',
      preference: {
        maxWeeklySessions: 15
      },
      skills: [
        { bookId: 'book-2' }
      ]
    });

    expect(result.id).toBe('t-1');
    expect(result.fullName).toBe('New Name');
    expect(result.preference).toBeDefined();
    expect(result.preference?.maxWeeklySessions).toBe(15);
    expect(result.skills).toBeDefined();
    expect(result.skills).toHaveLength(1);
    expect(result.skills?.[0].bookId).toBe('book-2');
    expect(mockRepo.findById).toHaveBeenCalledWith('t-1');
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });

  it('should throw error if teacher not found', async () => {
    const mockRepo: ITeacherRepository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new UpdateTeacherUseCase(mockRepo);
    
    await expect(useCase.execute({ id: 't-non-existent' })).rejects.toThrow('Teacher with id t-non-existent not found');
  });

  it('should clear preference and skills when passing null', async () => {
    const existingTeacher = {
      id: 't-1',
      fullName: 'Old Name',
      notes: null,
      preference: {
        id: 'pref-1',
        teacherId: 't-1',
        unavailableDayPattern: null,
        unavailableTimeRanges: null,
        maxWeeklySessions: 5,
        notes: null
      },
      skills: [
        { id: 'skill-1', teacherId: 't-1', bookId: 'book-1' }
      ],
    };

    const mockRepo: ITeacherRepository = {
      save: vi.fn().mockImplementation((teacher) => Promise.resolve(teacher)),
      findById: vi.fn().mockResolvedValue(existingTeacher as any),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new UpdateTeacherUseCase(mockRepo);
    
    const result = await useCase.execute({
      id: 't-1',
      preference: null,
      skills: null
    });

    expect(result.preference).toBeNull();
    expect(result.skills).toHaveLength(0);
  });

  it('should update multiple unavailable time ranges', async () => {
    const existingTeacher = {
      id: 't-1',
      fullName: 'Old Name',
      notes: null,
      preference: null,
      skills: [],
    };
    const mockRepo: ITeacherRepository = {
      save: vi.fn().mockImplementation((teacher) => Promise.resolve(teacher)),
      findById: vi.fn().mockResolvedValue(existingTeacher as any),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),      
      archive: vi.fn(),
    };
    const useCase = new UpdateTeacherUseCase(mockRepo);
    
    const result = await useCase.execute({
      id: 't-1',
      preference: {
        unavailableTimeRanges: ['09:00-11:00', '15:00-17:00']
      }
    });

    expect(result.preference?.unavailableTimeRanges).toEqual(['09:00-11:00', '15:00-17:00']);
  });
});
`;

fs.writeFileSync('src/application/use-cases/teachers/__tests__/update-teacher.use-case.test.ts', updateTeacherCode);
