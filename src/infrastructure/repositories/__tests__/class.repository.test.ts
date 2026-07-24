import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './db-setup';
import { ClassRepository } from '../class.repository';
import { Class } from '@/domain/models';

describe('ClassRepository', () => {
  let db: any;
  let repo: ClassRepository;

  beforeEach(() => {
    db = createTestDb();
    repo = new ClassRepository(db);
  });

  const sampleClass: Class = {
    id: 'class-1',
    name: 'Morning Class',
    bookId: 'book-1',
    teacherId: 'teacher-1',
    status: 'Scheduled',
    minCapacity: 1,
    targetCapacity: 5,
    maxCapacity: 10,
    notes: 'A nice class',
    schedules: [
      { id: 'sched-1', classId: 'class-1', weekDay: 'Monday', startTime: '10:00', endTime: '11:00' },
    ],
    enrollments: [
      { id: 'enr-1', classId: 'class-1', studentId: 'student-1', enrollmentStatus: 'Active', joinedAt: '2023-01-01T00:00:00Z', leftAt: null }
    ],
  };

  it('should save and find a class by id with schedules and enrollments', async () => {
    const saved = await repo.save(sampleClass);
    expect(saved).toEqual(sampleClass);

    const found = await repo.findById('class-1');
    expect(found).toEqual(sampleClass);
  });

  it('should update an existing class, removing schedules and enrollments', async () => {
    await repo.save(sampleClass);
    
    const updatedClass: Class = { 
      ...sampleClass, 
      name: 'Updated Morning Class',
      schedules: [],
      enrollments: [],
    };
    await repo.save(updatedClass);

    const found = await repo.findById('class-1');
    expect(found?.name).toBe('Updated Morning Class');
    expect(found?.schedules).toHaveLength(0);
    expect(found?.enrollments).toHaveLength(0);
  });

  it('should soft delete (archive) a class', async () => {
    await repo.save(sampleClass);
    await repo.archive('class-1');

    const activeClasses = await repo.findAllActive();
    expect(activeClasses).toHaveLength(0);

    const allClasses = await repo.findAll();
    expect(allClasses).toHaveLength(1);
  });
});
