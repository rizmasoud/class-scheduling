const fs = require('fs');
let path = 'src/domain/services/scheduling-engine/pipeline/candidate-generator.ts';
let code = fs.readFileSync(path, 'utf8');

// replace groupStudentsByBook with groupStudentsByBookAndAvailability
code = code.replace(
  /private groupStudentsByBook.*?return map;\n  }/s,
  `private groupStudentsByBookAndAvailability(students: readonly Student[], books: readonly Book[]): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const book of books) {
      map.set(book.id + '-Odd', []);
      map.set(book.id + '-Even', []);
      map.set(book.id + '-Both', []);
    }
    for (const student of students) {
      const pattern = student.preference?.availableDayPattern || 'Both';
      const key = student.currentBookId + '-' + pattern;
      const list = map.get(key);
      if (list) {
        list.push(student.id);
      } else {
        map.set(key, [student.id]);
      }
    }
    return map;
  }`
);

// update generate method signature and return type
code = code.replace(
  `  generate(
    context: SchedulingContext,
    timeSlots: readonly TimeSlot[],
    config: SchedulingEngineConfig
  ): readonly ClassCandidate[] {
    const candidates: ClassCandidate[] = [];
    const studentsByBook = this.groupStudentsByBook(context.activeStudents, context.activeBooks);`,
  `  generate(
    context: SchedulingContext,
    timeSlots: readonly TimeSlot[],
    config: SchedulingEngineConfig
  ): { candidates: readonly ClassCandidate[], rejectionReasons: Map<string, Set<string>> } {
    const candidates: ClassCandidate[] = [];
    const rejectionReasons = new Map<string, Set<string>>();
    
    const recordReason = (studentIds: readonly string[], reason: string) => {
      for (const id of studentIds) {
        if (!rejectionReasons.has(id)) {
          rejectionReasons.set(id, new Set());
        }
        rejectionReasons.get(id)!.add(reason);
      }
    };

    const studentsByBookAndAvailability = this.groupStudentsByBookAndAvailability(context.activeStudents, context.activeBooks);`
);

// update chunking logic inside generate
code = code.replace(
  /    for \(const book of context\.activeBooks\) \{\n      const studentIds = studentsByBook\.get\(book\.id\) \|\| \[\];\n      \n      if \(studentIds\.length === 0\) \{\n        continue;\n      \}\n\n      const studentChunks: string\[\]\[\] = \[\];\n      for \(let i = 0; i < studentIds\.length; i \+= config\.maximumCapacity\) \{\n        studentChunks\.push\(studentIds\.slice\(i, i \+ config\.maximumCapacity\)\);\n      \}\n\n      const eligibleTeachers = this\.findEligibleTeachers\(book, context\.activeTeachers\);\n\n      for \(const chunk of studentChunks\) \{/s,
  `    for (const book of context.activeBooks) {
      const eligibleTeachers = this.findEligibleTeachers(book, context.activeTeachers);

      const patterns = ['Odd', 'Even', 'Both'];
      for (const pattern of patterns) {
        const studentIds = studentsByBookAndAvailability.get(book.id + '-' + pattern) || [];
        
        if (studentIds.length === 0) {
          continue;
        }

        const studentChunks: string[][] = [];
        for (let i = 0; i < studentIds.length; i += config.maximumCapacity) {
          studentChunks.push(studentIds.slice(i, i + config.maximumCapacity));
        }

        for (const chunk of studentChunks) {
          if (eligibleTeachers.length === 0) {
            recordReason(chunk, 'NO_ELIGIBLE_TEACHER');
            continue;
          }
          
          let generatedCount = 0;`
);

code = code.replace(
  /        for \(const teacher of eligibleTeachers\) \{\n          for \(const slot of timeSlots\) \{\n            if \(\!this\.isTeacherAvailable\(teacher, slot\)\) \{\n              continue;\n            \}\n            if \(\!this\.areStudentsAvailable\(chunk, slot, context\.activeStudents\)\) \{\n              continue;\n            \}\n            if \(this\.slotConflictsWithExistingClasses\(chunk, teacher, slot, context\)\) \{\n              continue;\n            \}\n\n            candidates\.push\(this\.generateCandidate\(book, teacher, chunk, slot\)\);\n          \}\n        \}\n      \}\n    \}\n\n    return candidates;/s,
  `        for (const teacher of eligibleTeachers) {
          for (const slot of timeSlots) {
            if (!this.isTeacherAvailable(teacher, slot)) {
              continue;
            }
            if (!this.areStudentsAvailable(chunk, slot, context.activeStudents)) {
              continue;
            }
            if (this.slotConflictsWithExistingClasses(chunk, teacher, slot, context)) {
              continue;
            }

            candidates.push(this.generateCandidate(book, teacher, chunk, slot));
            generatedCount++;
          }
        }
        
        if (generatedCount === 0) {
          recordReason(chunk, 'NO_MUTUAL_AVAILABILITY');
        }
      }
    }
    }

    return { candidates, rejectionReasons };`
);


fs.writeFileSync(path, code);
console.log('patched candidate-generator.ts');
