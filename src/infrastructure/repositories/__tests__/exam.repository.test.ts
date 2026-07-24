import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './db-setup';
import { ExamRepository } from '../exam.repository';
import { ExamResult } from '@/domain/models';

describe('ExamRepository', () => {
  let db: any;
  let repo: ExamRepository;

  beforeEach(() => {
    db = createTestDb();
    repo = new ExamRepository(db);
  });

  const sampleExam: ExamResult = {
    id: 'exam-1',
    classStudentId: 'enrollment-1',
    score: 85,
    resultStatus: 'Passed',
    supervisorDecision: null,
    examDate: '2023-10-10',
    notes: 'Good job',
  };

  it('should save and find an exam result by id', async () => {
    const saved = await repo.save(sampleExam);
    expect(saved).toEqual(sampleExam);

    const found = await repo.findById('exam-1');
    expect(found).toEqual(sampleExam);
  });

  it('should return null for invalid ID', async () => {
    const found = await repo.findById('non-existent');
    expect(found).toBeNull();
  });

  it('should update an existing exam result', async () => {
    await repo.save(sampleExam);
    
    const updatedExam: ExamResult = { ...sampleExam, score: 90, resultStatus: 'Conditional', notes: 'Excellent' };
    await repo.save(updatedExam);

    const found = await repo.findById('exam-1');
    expect(found?.score).toBe(90);
    expect(found?.notes).toBe('Excellent');
  });

  it('should retrieve multiple exam results', async () => {
    await repo.save({ ...sampleExam, id: 'e1' });
    await repo.save({ ...sampleExam, id: 'e2' });

    const many = await repo.findMany(['e1', 'e2', 'non']);
    expect(many).toHaveLength(2);
  });

  it('should find all exams', async () => {
    await repo.save({ ...sampleExam, id: 'e1' });
    await repo.save({ ...sampleExam, id: 'e2' });

    const all = await repo.findAll();
    expect(all).toHaveLength(2);
  });
});
