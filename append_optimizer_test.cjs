const fs = require('fs');

const path = 'src/domain/services/scheduling-engine/pipeline/__tests__/optimizer.test.ts';
let code = fs.readFileSync(path, 'utf-8');

const newTest = `
  it('allows two classes with different teachers and different students to occupy the same time slot (parallel classes)', () => {
    const optimizer = new Optimizer();
    const sameTimeCand1: ClassCandidate = { bookId: 'b1', teacherId: 't1', studentIds: ['st1'], timeSlot: slotMondayMorning };
    const sameTimeCand2: ClassCandidate = { bookId: 'b2', teacherId: 't2', studentIds: ['st2'], timeSlot: slotMondayMorning };
    
    const input: EvaluatedCandidate[] = [
      { candidate: sameTimeCand1, totalScore: 50, reasons: [] },
      { candidate: sameTimeCand2, totalScore: 40, reasons: [] },
    ];
    
    const accepted = optimizer.optimize(input, dummyContext);
    expect(accepted).toHaveLength(2);
    expect(accepted).toContain(sameTimeCand1);
    expect(accepted).toContain(sameTimeCand2);
  });
});
`;

code = code.replace(/\}\);\s*$/, newTest);

fs.writeFileSync(path, code);
console.log('appended test to optimizer');
