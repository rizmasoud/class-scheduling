const fs = require('fs');
let content = fs.readFileSync('src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts', 'utf8');

content = content.replace(`    const teacher: Teacher = {
      id: 'teacher-A',
      fullName: 'Teacher A',
      notes: null,
      skills: [
        { id: 's1', teacherId: 'teacher-A', bookId: 'book-A' },
        { id: 's2', teacherId: 'teacher-A', bookId: 'book-B' }
      ],
      preference: {
         id: 'p1',
         teacherId: 'teacher-A',
         maxWeeklySessions: 2,
         unavailableDayPattern: null,
         unavailableTimeRanges: null,
         notes: null
      }
    };`,
`    const teacher: Teacher = {
      id: 'teacher-A',
      fullName: 'Teacher A',
      notes: null,
      skills: [
        { id: 's1', teacherId: 'teacher-A', bookId: 'book-A' }
      ]
    };
    const teacherB: Teacher = {
      id: 'teacher-B',
      fullName: 'Teacher B',
      notes: null,
      skills: [
        { id: 's2', teacherId: 'teacher-B', bookId: 'book-B' }
      ]
    };`);

content = content.replace(/vi\.mocked\(teacherRepo\.findAllActive\)\.mockResolvedValue\(\[teacher\]\);/g, "vi.mocked(teacherRepo.findAllActive).mockResolvedValue([teacher, teacherB]);");

fs.writeFileSync('src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts', content);
