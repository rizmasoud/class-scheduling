const fs = require('fs');
let path = 'src/application/use-cases/proposals/__tests__/generate-proposal.use-case.test.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `classes: []`,
  `classes: [{ id: 'class-1', proposalId: 'prop-1', bookId: 'b-1', teacherId: 't-1', status: 'Draft', score: 10, reasons: [] }]`
);

const zeroClassTest = `
  it('should not persist if zero classes are generated', async () => {
    const mockProposalRepo: IProposalRepository = {
      findById: vi.fn(),
      findActiveDraft: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      saveWithClasses: vi.fn(),
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
      { findAllActive: vi.fn().mockResolvedValue([]) } as any,
      { findAllActive: vi.fn().mockResolvedValue([]) } as any,
      { findAllActive: vi.fn().mockResolvedValue([]) } as any,
      { findAllActive: vi.fn().mockResolvedValue([]) } as any,
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

    expect(mockProposalRepo.save).not.toHaveBeenCalled();
    expect(result).toBe(fakeProposal);
  });
`;

code = code.replace(/}\);\s*}\);/, `});${zeroClassTest}});\n`);

fs.writeFileSync(path, code);
console.log('patched test');
