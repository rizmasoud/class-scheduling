import { describe, it, expect, vi } from 'vitest';
import { GenerateProposalUseCase, GenerateProposalDTO } from '../generate-proposal.use-case';
import { TimeSlotGenerator } from '@/domain/services/scheduling-engine/pipeline/time-slot-generator';
import { CandidateGenerator } from '@/domain/services/scheduling-engine/pipeline/candidate-generator';
import { RuleEngine } from '@/domain/services/scheduling-engine/rules/rule-engine';
import { Optimizer } from '@/domain/services/scheduling-engine/pipeline/optimizer';
import { ProposalAssembler } from '@/domain/services/scheduling-engine/pipeline/proposal-assembler';
import { SchedulingEngine } from '@/domain/services/scheduling-engine/scheduling-engine';

import { CapacityLimitRule } from '@/domain/services/scheduling-engine/rules/hard-rules/capacity-limit.rule';
import { StudentDoubleBookingRule } from '@/domain/services/scheduling-engine/rules/hard-rules/student-double-booking.rule';
import { TeacherBookCompatibilityRule } from '@/domain/services/scheduling-engine/rules/hard-rules/teacher-book-compatibility.rule';
import { TeacherTimeConflictRule } from '@/domain/services/scheduling-engine/rules/hard-rules/teacher-time-conflict.rule';
import { BalancedDistributionRule } from '@/domain/services/scheduling-engine/rules/soft-rules/balanced-distribution.rule';
import { OptimalCapacityRule } from '@/domain/services/scheduling-engine/rules/soft-rules/optimal-capacity.rule';
import { TeacherExperienceRule } from '@/domain/services/scheduling-engine/rules/soft-rules/teacher-experience.rule';
import { TeacherPreferenceRule } from '@/domain/services/scheduling-engine/rules/soft-rules/teacher-preference.rule';

import { IBookRepository } from '@/domain/repositories/i-book.repository';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';
import { IClassRepository } from '@/domain/repositories/i-class.repository';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';
import { Book, Teacher, Student } from '@/domain/models';

describe('GenerateProposalUseCase (Integration)', () => {
  const createRealSchedulingEngine = () => {
    return new SchedulingEngine(
      new TimeSlotGenerator(),
      new CandidateGenerator(),
      new RuleEngine([
        new CapacityLimitRule(),
        new StudentDoubleBookingRule(),
        new TeacherBookCompatibilityRule(),
        new TeacherTimeConflictRule(),
        new BalancedDistributionRule(),
        new OptimalCapacityRule(),
        new TeacherExperienceRule(),
        new TeacherPreferenceRule()
      ]),
      new Optimizer(),
      new ProposalAssembler()
    );
  };

  const createConfig = () => ({
    minimumCapacity: 5,
    preferredCapacity: 8,
    maximumCapacity: 12,
    ruleWeights: {
      teacherPreferenceWeight: 1,
      capacityWeight: 1,
      bookCompatibilityWeight: 1,
    },
    timeSlotConfig: {
      allowedDaysOfWeek: ['Monday', 'Tuesday'],
      instituteHours: {
        openingTime: '08:00',
        closingTime: '12:00',
      },
      classDurationMinutes: 120,
    },
  });

  const createMockRepos = () => {
    return {
      bookRepo: { findAllActive: vi.fn() } as unknown as IBookRepository,
      teacherRepo: { findAllActive: vi.fn() } as unknown as ITeacherRepository,
      studentRepo: { findAllActive: vi.fn() } as unknown as IStudentRepository,
      classRepo: { findAllActive: vi.fn() } as unknown as IClassRepository,
      proposalRepo: { 
        findActiveDraft: vi.fn().mockResolvedValue(null),
        save: vi.fn().mockImplementation((p) => Promise.resolve(p)) 
      } as unknown as IProposalRepository,
    };
  };

  it('should generate a realistic proposal with classes when constraints are met', async () => {
    const { bookRepo, teacherRepo, studentRepo, classRepo, proposalRepo } = createMockRepos();
    
    const bookA: Book = { id: 'book-A', name: 'Book A', level: 1, sequenceOrder: 1, sessionCount: 10 };
    
    const teacherA: Teacher = {
      id: 'teacher-A',
      fullName: 'Teacher A',
      notes: null,
      skills: [{ id: 's1', teacherId: 'teacher-A', bookId: 'book-A' }]
    };
    
    const students = Array.from({ length: 8 }).map((_, i) => ({
      id: `student-${i}`,
      fullName: `Student ${i}`,
      currentBookId: 'book-A',
      notes: null,
      preference: {
        id: `pref-${i}`,
        studentId: `student-${i}`,
        availableDayPattern: 'Both' as any,
        unavailableTimeRanges: [],
        notes: null
      }
    } as Student));

    vi.mocked(bookRepo.findAllActive).mockResolvedValue([bookA]);
    vi.mocked(teacherRepo.findAllActive).mockResolvedValue([teacherA]);
    vi.mocked(studentRepo.findAllActive).mockResolvedValue(students);
    vi.mocked(classRepo.findAllActive).mockResolvedValue([]);

    const engine = createRealSchedulingEngine();
    const useCase = new GenerateProposalUseCase(
      bookRepo,
      teacherRepo,
      studentRepo,
      classRepo,
      proposalRepo,
      engine
    );

    const dto: GenerateProposalDTO = { date: '2023-10-10', config: createConfig() };
    const result = await useCase.execute(dto);

    expect(result).toBeDefined();
    expect(result.status).toBe('Draft');
    expect(result.classes).toBeDefined();
    expect(result.classes!.length).toBeGreaterThan(0);
    
    const generatedClass = result.classes![0];
    expect(generatedClass.teacherId).toBe('teacher-A');
    expect(generatedClass.bookId).toBe('book-A');
    expect(generatedClass.schedules).toBeDefined();
    expect(generatedClass.schedules!.length).toBeGreaterThan(0);
    expect(generatedClass.generatedName).toContain('Book A');
    expect(generatedClass.generatedName).toContain('Teacher A');
  });

  it('should generate a proposal with zero classes when no teacher can teach the required book', async () => {
    const { bookRepo, teacherRepo, studentRepo, classRepo, proposalRepo } = createMockRepos();
    
    const bookA: Book = { id: 'book-A', name: 'Book A', level: 1, sequenceOrder: 1, sessionCount: 10 };
    
    const teacherB: Teacher = {
      id: 'teacher-B',
      fullName: 'Teacher B',
      notes: null,
      skills: [{ id: 's2', teacherId: 'teacher-B', bookId: 'some-other-book' }]
    };
    
    const students = Array.from({ length: 8 }).map((_, i) => ({
      id: `student-${i}`,
      fullName: `Student ${i}`,
      currentBookId: 'book-A',
      notes: null
    } as Student));

    vi.mocked(bookRepo.findAllActive).mockResolvedValue([bookA]);
    vi.mocked(teacherRepo.findAllActive).mockResolvedValue([teacherB]);
    vi.mocked(studentRepo.findAllActive).mockResolvedValue(students);
    vi.mocked(classRepo.findAllActive).mockResolvedValue([]);

    const engine = createRealSchedulingEngine();
    const useCase = new GenerateProposalUseCase(
      bookRepo,
      teacherRepo,
      studentRepo,
      classRepo,
      proposalRepo,
      engine
    );

    const dto: GenerateProposalDTO = { date: '2023-10-10', config: createConfig() };
    const result = await useCase.execute(dto);

    expect(result).toBeDefined();
    expect(result.status).toBe('Draft');
    expect(result.classes).toBeDefined();
    expect(result.classes!.length).toBe(0);
  });
});
