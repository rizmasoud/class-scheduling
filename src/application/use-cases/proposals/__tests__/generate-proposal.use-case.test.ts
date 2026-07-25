import { describe, it, expect, vi } from 'vitest';
import { GenerateProposalUseCase, GenerateProposalDTO } from '../generate-proposal.use-case';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';
import { IBookRepository } from '@/domain/repositories/i-book.repository';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';

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

    const useCase = new GenerateProposalUseCase(
      mockProposalRepo,
      mockBookRepo,
      mockTeacherRepo,
      mockStudentRepo
    );

    const dto: GenerateProposalDTO = { date: '2023-01-01' };
    const result = await useCase.execute(dto);

    expect(mockBookRepo.findAllActive).toHaveBeenCalled();
    expect(mockTeacherRepo.findAllActive).toHaveBeenCalled();
    expect(mockStudentRepo.findAllActive).toHaveBeenCalled();
    expect(mockProposalRepo.save).toHaveBeenCalled();
    
    expect(result.status).toBe('Draft');
    expect(result.generatedAt).toBe('2023-01-01');
    expect(result.classes).toEqual([]);
  });
});
