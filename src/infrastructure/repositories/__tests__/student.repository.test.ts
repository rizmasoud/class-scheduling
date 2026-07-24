import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './db-setup';
import { StudentRepository } from '../student.repository';
import { Student } from '@/domain/models';

describe('StudentRepository', () => {
  let db: any;
  let repo: StudentRepository;

  beforeEach(() => {
    db = createTestDb();
    repo = new StudentRepository(db);
  });

  const sampleStudent: Student = {
    id: 's-1',
    fullName: 'John Doe',
    currentBookId: 'book-1',
    notes: 'Good student',
    preference: {
      id: 'sp-1',
      studentId: 's-1',
      availableDayPattern: 'Even',
      unavailableTimeRanges: null,
      notes: null,
    },
  };

  it('should save and find a student by id with preference', async () => {
    const saved = await repo.save(sampleStudent);
    expect(saved).toEqual(sampleStudent);

    const found = await repo.findById('s-1');
    expect(found).toEqual(sampleStudent);
  });

  it('should save and find a student without preference', async () => {
    const noPrefStudent = { ...sampleStudent, id: 's-2', preference: undefined };
    const saved = await repo.save(noPrefStudent);
    expect(saved).toEqual(noPrefStudent);

    const found = await repo.findById('s-2');
    expect(found?.preference).toBeUndefined();
  });

  it('should update an existing student and preference', async () => {
    await repo.save(sampleStudent);
    
    const updatedStudent: Student = { 
      ...sampleStudent, 
      fullName: 'John Updated',
      preference: {
        ...sampleStudent.preference!,
        availableDayPattern: 'Odd'
      }
    };
    await repo.save(updatedStudent);

    const found = await repo.findById('s-1');
    expect(found?.fullName).toBe('John Updated');
    expect(found?.preference?.availableDayPattern).toBe('Odd');
  });

  it('should soft delete (archive) a student', async () => {
    await repo.save(sampleStudent);
    await repo.archive('s-1');

    const activeStudents = await repo.findAllActive();
    expect(activeStudents).toHaveLength(0);

    const allStudents = await repo.findAll();
    expect(allStudents).toHaveLength(1);
  });

  it('should retrieve multiple students with preferences', async () => {
    await repo.save(sampleStudent);
    await repo.save({ ...sampleStudent, id: 's-2', preference: undefined });

    const many = await repo.findMany(['s-1', 's-2']);
    expect(many).toHaveLength(2);
    expect(many.find(s => s.id === 's-1')?.preference).toBeDefined();
    expect(many.find(s => s.id === 's-2')?.preference).toBeUndefined();
  });

  it('rollback on failure: should not insert student if preference insert fails', async () => {
    // Force a failure by passing invalid data to preference that SQLite rejects
    // e.g. null for a NOT NULL field like availableDayPattern (if not null)
    // Actually in better-sqlite3 not null will throw error
    const badStudent: Student = {
      ...sampleStudent,
      id: 's-3',
      preference: {
        ...sampleStudent.preference!,
        id: 'sp-3',
        studentId: 's-3',
        availableDayPattern: null as any // Force error
      }
    };

    await expect(repo.save(badStudent)).rejects.toThrow();

    const found = await repo.findById('s-3');
    expect(found).toBeNull();
  });
});
