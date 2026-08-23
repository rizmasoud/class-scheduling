const fs = require('fs');
let content = fs.readFileSync('src/domain/services/scheduling-engine/pipeline/__tests__/candidate-generator.test.ts', 'utf8');

// just remove the messed up tail and append cleanly
content = content.replace(/it\('generates a candidate with 2 sessions[\s\S]*/, '');
// ensure it ends with `});\n});\n`
content = content.replace(/\}\);\s*$/, '');
content = content.replace(/\}\);\s*$/, '');
content = content.replace(/\}\);\s*$/, '');

content += `
  describe('Multi-session candidates', () => {
    it('generates a candidate with 2 sessions when sessionCount is 2', () => {
      const generator = new CandidateGenerator();
      const localBook = { ...book1, sessionCount: 2 };
      const slot2 = { id: 's2', weekDay: 'Wednesday', startTime: '08:00', endTime: '10:00' } as TimeSlot;
      const context = { activeBooks: [localBook], activeTeachers: [teacher1], activeStudents: [student1], activeClasses: [] };
      const { candidates } = generator.generate(context, [slot1, slot2], config);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].timeSlots).toHaveLength(2);
      expect(candidates[0].timeSlots[0].id).toBe('s1');
      expect(candidates[0].timeSlots[1].id).toBe('s2');
    });

    it('generates a candidate with 3 sessions when sessionCount is 3', () => {
      const generator = new CandidateGenerator();
      const localBook = { ...book1, sessionCount: 3 };
      const slot2 = { id: 's2', weekDay: 'Wednesday', startTime: '08:00', endTime: '10:00' } as TimeSlot;
      const slot3 = { id: 's3', weekDay: 'Saturday', startTime: '08:00', endTime: '10:00' } as TimeSlot;
      const context = { activeBooks: [localBook], activeTeachers: [teacher1], activeStudents: [student1], activeClasses: [] };
      const { candidates } = generator.generate(context, [slot1, slot2, slot3], config);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].timeSlots).toHaveLength(3);
    });

    it('skips student if unavailable for one required session', () => {
      const generator = new CandidateGenerator();
      const localBook = { ...book1, sessionCount: 2 };
      const slot2 = { id: 's2', weekDay: 'Wednesday', startTime: '08:00', endTime: '10:00' } as TimeSlot;
      const localStudent = { ...student1, preference: { id: 'p', studentId: 'st1', availableDayPattern: 'Both' as any, unavailableTimeRanges: null, notes: null } };
      const activeClass = {
        id: 'c1', name: 'Class 1', bookId: 'b2', teacherId: 't2', status: 'Active', minCapacity: 5, targetCapacity: 10, maxCapacity: 15, notes: null,
        schedules: [{ id: 'sc1', classId: 'c1', weekDay: 'Monday', startTime: '08:00', endTime: '10:00' }],
        enrollments: [{ id: 'en1', classId: 'c1', studentId: 'st1', enrollmentStatus: 'Active', joinedAt: '', leftAt: null }]
      } as Class;
      const context = { activeBooks: [localBook], activeTeachers: [teacher1], activeStudents: [localStudent], activeClasses: [activeClass] };
      const { candidates } = generator.generate(context, [slot1, slot2], config);
      expect(candidates).toHaveLength(0);
    });

    it('skips teacher if unavailable for one required session', () => {
      const generator = new CandidateGenerator();
      const localBook = { ...book1, sessionCount: 2 };
      const slot2 = { id: 's2', weekDay: 'Wednesday', startTime: '08:00', endTime: '10:00' } as TimeSlot;
      const activeClass = {
        id: 'c1', name: 'Class 1', bookId: 'b2', teacherId: 't1', status: 'Active', minCapacity: 5, targetCapacity: 10, maxCapacity: 15, notes: null,
        schedules: [{ id: 'sc1', classId: 'c1', weekDay: 'Wednesday', startTime: '08:00', endTime: '10:00' }]
      } as Class;
      const context = { activeBooks: [localBook], activeTeachers: [teacher1], activeStudents: [student1], activeClasses: [activeClass] };
      const { candidates } = generator.generate(context, [slot1, slot2], config);
      expect(candidates).toHaveLength(0);
    });
  });
});
`;

fs.writeFileSync('src/domain/services/scheduling-engine/pipeline/__tests__/candidate-generator.test.ts', content);
