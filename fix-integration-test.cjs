const fs = require('fs');
let content = fs.readFileSync('src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts', 'utf8');

content = content.replace(`    const teacher: Teacher = {
      id: 'teacher-A',
      fullName: 'Teacher A',
      notes: null,
      skills: [
        { id: 's1', teacherId: 'teacher-A', bookId: 'book-A' },
        { id: 's2', teacherId: 'teacher-A', bookId: 'book-B' }
      ]
    };`,
`    const teacher: Teacher = {
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
    };`);

fs.writeFileSync('src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts', content);
