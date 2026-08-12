const fs = require('fs');

let createStudentTest = fs.readFileSync('src/application/use-cases/students/__tests__/create-student.use-case.test.ts', 'utf-8');
createStudentTest = createStudentTest.replace(
  `});`,
  `  it('should create and save a new student with multiple unavailable time ranges', async () => {
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
});`
);
fs.writeFileSync('src/application/use-cases/students/__tests__/create-student.use-case.test.ts', createStudentTest);

let updateStudentTest = fs.readFileSync('src/application/use-cases/students/__tests__/update-student.use-case.test.ts', 'utf-8');
updateStudentTest = updateStudentTest.replace(
  `});`,
  `  it('should update multiple unavailable time ranges', async () => {
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
});`
);
fs.writeFileSync('src/application/use-cases/students/__tests__/update-student.use-case.test.ts', updateStudentTest);
console.log('updated student usecase tests');
