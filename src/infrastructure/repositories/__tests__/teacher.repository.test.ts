import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './db-setup';
import { TeacherRepository } from '../teacher.repository';
import { Teacher } from '@/domain/models';

describe('TeacherRepository', () => {
  let db: any;
  let repo: TeacherRepository;

  beforeEach(() => {
    db = createTestDb();
    repo = new TeacherRepository(db);
  });

  const sampleTeacher: Teacher = {
    id: 't-1',
    fullName: 'Jane Smith',
    notes: 'Good teacher',
    preference: {
      id: 'tp-1',
      teacherId: 't-1',
      unavailableDayPattern: null,
      unavailableTimeRanges: null,
      maxWeeklySessions: 20,
      notes: null,
    },
    skills: [
      { id: 'ts-1', teacherId: 't-1', bookId: 'book-1' },
      { id: 'ts-2', teacherId: 't-1', bookId: 'book-2' },
    ],
  };

  it('should save and find a teacher by id with preference and skills', async () => {
    const saved = await repo.save(sampleTeacher);
    expect(saved).toEqual(sampleTeacher);

    const found = await repo.findById('t-1');
    expect(found).toEqual(sampleTeacher);
  });

  it('should save and find a teacher without preference and skills', async () => {
    const noExtrasTeacher = { ...sampleTeacher, id: 't-2', preference: undefined, skills: undefined };
    const saved = await repo.save(noExtrasTeacher);
    expect(saved).toEqual({ ...noExtrasTeacher, skills: [] });

    const found = await repo.findById('t-2');
    expect(found?.preference).toBeUndefined();
    expect(found?.skills).toHaveLength(0); // or undefined based on how DB returns it
  });

  it('should update an existing teacher, preference, and skills', async () => {
    await repo.save(sampleTeacher);
    
    const updatedTeacher: Teacher = { 
      ...sampleTeacher, 
      fullName: 'Jane Updated',
      preference: {
        ...sampleTeacher.preference!,
        maxWeeklySessions: 25
      },
      skills: [
        { id: 'ts-1', teacherId: 't-1', bookId: 'book-1' } // removing ts-2
      ]
    };
    await repo.save(updatedTeacher);

    const found = await repo.findById('t-1');
    expect(found?.fullName).toBe('Jane Updated');
    expect(found?.preference?.maxWeeklySessions).toBe(25);
    // Actually the save method in teacher repo currently iterates over skills and updates/inserts them. 
    // It doesn't delete missing ones yet! Let's check the assertion.
    // So the previous skills might still be there if we didn't implement orphan removal.
    // The prompt says: Verify no child entities remain orphaned after updates.
    // If the test fails, it means we have a bug to fix!
    expect(found?.skills).toHaveLength(1);
    expect(found?.skills?.[0]?.bookId).toBe('book-1');
  });

  it('should soft delete (archive) a teacher', async () => {
    await repo.save(sampleTeacher);
    await repo.archive('t-1');

    const activeTeachers = await repo.findAllActive();
    expect(activeTeachers).toHaveLength(0);

    const allTeachers = await repo.findAll();
    expect(allTeachers).toHaveLength(1);
  });

  it('rollback on failure: should not insert teacher if skills insert fails', async () => {
    const badTeacher: Teacher = {
      ...sampleTeacher,
      id: 't-3',
      skills: [
        { id: 'ts-3', teacherId: 't-3', bookId: null as any } // Force error
      ]
    };

    await expect(repo.save(badTeacher)).rejects.toThrow();

    const found = await repo.findById('t-3');
    expect(found).toBeNull();
  });
});
