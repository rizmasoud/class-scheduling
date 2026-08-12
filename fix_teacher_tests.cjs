const fs = require('fs');

let createTeacherTest = fs.readFileSync('src/application/use-cases/teachers/__tests__/create-teacher.use-case.test.ts', 'utf-8');
createTeacherTest = createTeacherTest.replace(
  `});`,
  `  it('should create and save a new teacher with multiple unavailable time ranges', async () => {
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
});`
);
fs.writeFileSync('src/application/use-cases/teachers/__tests__/create-teacher.use-case.test.ts', createTeacherTest);

let updateTeacherTest = fs.readFileSync('src/application/use-cases/teachers/__tests__/update-teacher.use-case.test.ts', 'utf-8');
updateTeacherTest = updateTeacherTest.replace(
  `});`,
  `  it('should update multiple unavailable time ranges', async () => {
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
});`
);
fs.writeFileSync('src/application/use-cases/teachers/__tests__/update-teacher.use-case.test.ts', updateTeacherTest);
console.log('updated teacher usecase tests');
