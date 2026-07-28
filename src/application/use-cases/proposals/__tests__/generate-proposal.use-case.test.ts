import { describe, it, expect, vi } from 'vitest';
import { GenerateProposalUseCase, GenerateProposalDTO } from '../generate-proposal.use-case';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';
import { IBookRepository } from '@/domain/repositories/i-book.repository';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';
import { IClassRepository } from '@/domain/repositories/i-class.repository';
import { SchedulingEngine } from '@/domain/services/scheduling-engine/scheduling-engine';
import { SchedulingEngineConfig } from '@/domain/services/scheduling-engine/config/scheduling-engine.config';
import { SchedulingProposal } from '@/domain/models';

describe('GenerateProposalUseCase', () => {
  it('should generate a proposal draft successfully', async () => {
    const mockProposalRepo: IProposalRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn().mockImplementation((p) => Promise.resolve(p)),
      saveWithClasses: vi.fn(),
      archive: vi.fn(),
    };
    
    const mockBookRepo: IBookRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn().mockResolvedValue([{ id: 'b-1', name: 'Book 1' }]),
      findMany: vi.fn(),
      save: vi.fn(),
      archive: vi.fn(),
    };
    
    const mockTeacherRepo: ITeacherRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn().mockResolvedValue([{ id: 't-1', fullName: 'Teacher 1' }]),
      findMany: vi.fn(),
      save: vi.fn(),
      archive: vi.fn(),
    };
    
    const mockStudentRepo: IStudentRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn().mockResolvedValue([{ id: 's-1', fullName: 'Student 1' }]),
      findMany: vi.fn(),
      save: vi.fn(),
      archive: vi.fn(),
    };

    const mockClassRepo: IClassRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn().mockResolvedValue([{ id: 'c-1', name: 'Class 1' }]),
      findMany: vi.fn(),
      save: vi.fn(),
      saveMany: vi.fn(),
      archive: vi.fn(),
    };

    const fakeProposal: SchedulingProposal = {
      id: 'prop-1',
      generatedAt: '2023-01-01',
      status: 'Draft',
      notes: null,
      classes: []
    };

    const mockSchedulingEngine = {
      generateProposal: vi.fn().mockReturnValue(fakeProposal)
    } as unknown as SchedulingEngine;

    const useCase = new GenerateProposalUseCase(
      mockBookRepo,
      mockTeacherRepo,
      mockStudentRepo,
      mockClassRepo,
      mockProposalRepo,
      mockSchedulingEngine
    );

    const config: SchedulingEngineConfig = {
      minimumCapacity: 5,
      preferredCapacity: 10,
      maximumCapacity: 15,
      ruleWeights: { teacherPreferenceWeight: 1, capacityWeight: 1, bookCompatibilityWeight: 1 },
      timeSlotConfig: { allowedDaysOfWeek: [], instituteHours: { openingTime: '08:00', closingTime: '12:00' }, classDurationMinutes: 60 }
    };

    const dto: GenerateProposalDTO = { date: '2023-01-01', config };

    const result = await useCase.execute(dto);

    expect(mockBookRepo.findAllActive).toHaveBeenCalledOnce();
    expect(mockTeacherRepo.findAllActive).toHaveBeenCalledOnce();
    expect(mockStudentRepo.findAllActive).toHaveBeenCalledOnce();
    expect(mockClassRepo.findAllActive).toHaveBeenCalledOnce();

    expect(mockSchedulingEngine.generateProposal).toHaveBeenCalledOnce();
    expect(mockSchedulingEngine.generateProposal).toHaveBeenCalledWith(expect.objectContaining({
      generatedAt: '2023-01-01',
      activeBooks: [{ id: 'b-1', name: 'Book 1' }],
      activeTeachers: [{ id: 't-1', fullName: 'Teacher 1' }],
      activeStudents: [{ id: 's-1', fullName: 'Student 1' }],
      activeClasses: [{ id: 'c-1', name: 'Class 1' }],
      config
    }));

    expect(mockProposalRepo.save).toHaveBeenCalledOnce();
    expect(mockProposalRepo.save).toHaveBeenCalledWith(fakeProposal);
    
    expect(result).toBe(fakeProposal);
  });
});
