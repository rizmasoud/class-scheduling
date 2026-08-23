const fs = require('fs');
let content = fs.readFileSync('src/domain/services/scheduling-engine/pipeline/__tests__/optimizer.test.ts', 'utf8');

// Replace standard optimize calls with one passing config
const configStr = `
  const dummyConfig = {
    minimumCapacity: 1,
    preferredCapacity: 2,
    maximumCapacity: 10,
    timeSlotConfig: { allowedDaysOfWeek: ['Monday', 'Tuesday'], instituteHours: { openingTime: '08:00', closingTime: '18:00' }, classDurationMinutes: 120 },
    ruleWeights: { capacityWeight: 1, teacherPreferenceWeight: 1, bookCompatibilityWeight: 1 }
  };
`;

content = content.replace("describe('Optimizer', () => {", "describe('Optimizer', () => {" + configStr);

content = content.replace(/optimizer\.optimize\((.*?),\s*dummyContext\)/g, "optimizer.optimize($1, dummyContext, dummyConfig)");
content = content.replace(/optimizer\.optimize\((.*?),\s*context\)/g, "optimizer.optimize($1, context, dummyConfig)");
content = content.replace(/optimizer\.optimize\(\[evalCand\],\s*localContext\)/g, "optimizer.optimize([evalCand], localContext, dummyConfig)");
content = content.replace(/optimizer\.optimize\(\[evalCand1, evalCand2\],\s*dummyContext\)/g, "optimizer.optimize([evalCand1, evalCand2], dummyContext, dummyConfig)");

// Remove old 'rejects candidate with student conflict'
content = content.replace(/it\('rejects candidate with student conflict'[\s\S]*?\}\);/g, '');

content += `
describe('Phase 2 Student Conflict Rules', () => {
  const dummyConfig = {
    minimumCapacity: 1,
    preferredCapacity: 2,
    maximumCapacity: 10,
    timeSlotConfig: { allowedDaysOfWeek: ['Monday', 'Tuesday'], instituteHours: { openingTime: '08:00', closingTime: '18:00' }, classDurationMinutes: 120 },
    ruleWeights: { capacityWeight: 1, teacherPreferenceWeight: 1, bookCompatibilityWeight: 1 }
  };

  const slotMon = { id: 's1', weekDay: 'Monday', startTime: '09:00', endTime: '10:30' };
  const slotWed = { id: 's2', weekDay: 'Wednesday', startTime: '09:00', endTime: '10:30' };

  it('Partial student conflict', () => {
    const optimizer = new Optimizer();
    const c1 = { bookId: 'b1', teacherId: 't1', studentIds: ['s1', 's2', 's3'], timeSlots: [slotMon] };
    const c2 = { bookId: 'b2', teacherId: 't2', studentIds: ['s3', 's4', 's5'], timeSlots: [slotMon] };
    const input = [
      { candidate: c1, totalScore: 50, reasons: [] },
      { candidate: c2, totalScore: 40, reasons: [] }
    ];
    const { accepted } = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted).toHaveLength(2);
    expect(accepted[0].studentIds).toEqual(['s1', 's2', 's3']);
    expect(accepted[1].studentIds).toEqual(['s4', 's5']);
  });

  it('Entire candidate conflicts', () => {
    const optimizer = new Optimizer();
    const c1 = { bookId: 'b1', teacherId: 't1', studentIds: ['s1', 's2', 's3'], timeSlots: [slotMon] };
    const c2 = { bookId: 'b2', teacherId: 't2', studentIds: ['s1', 's2', 's3'], timeSlots: [slotMon] };
    const input = [
      { candidate: c1, totalScore: 50, reasons: [] },
      { candidate: c2, totalScore: 40, reasons: [] }
    ];
    const { accepted } = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toBe(c1);
  });

  it('Below minimum capacity', () => {
    const optimizer = new Optimizer();
    const c1 = { bookId: 'b1', teacherId: 't1', studentIds: ['s1', 's2', 's3'], timeSlots: [slotMon] };
    const c2 = { bookId: 'b2', teacherId: 't2', studentIds: ['s3', 's4'], timeSlots: [slotMon] };
    const input = [
      { candidate: c1, totalScore: 50, reasons: [] },
      { candidate: c2, totalScore: 40, reasons: [] }
    ];
    const strictConfig = { ...dummyConfig, minimumCapacity: 2 };
    const { accepted, rejectionReasons } = optimizer.optimize(input, dummyContext, strictConfig);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toBe(c1);
    expect(rejectionReasons.get('s4')?.has('OPTIMIZER_CONFLICT')).toBe(true);
  });

  it('Multi-session partial conflict', () => {
    const optimizer = new Optimizer();
    const c1 = { bookId: 'b1', teacherId: 't1', studentIds: ['s3'], timeSlots: [slotMon, slotWed] };
    const c2 = { bookId: 'b2', teacherId: 't2', studentIds: ['s3', 's4', 's5'], timeSlots: [slotMon, slotWed] };
    const input = [
      { candidate: c1, totalScore: 50, reasons: [] },
      { candidate: c2, totalScore: 40, reasons: [] }
    ];
    const { accepted } = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted).toHaveLength(2);
    expect(accepted[0]).toBe(c1);
    expect(accepted[1].studentIds).toEqual(['s4', 's5']);
    expect(accepted[1].timeSlots).toHaveLength(2);
  });

  it('Student has no schedule conflict', () => {
    const optimizer = new Optimizer();
    const slotAfternoon = { id: 's3', weekDay: 'Monday', startTime: '14:00', endTime: '15:30' };
    const c1 = { bookId: 'b1', teacherId: 't1', studentIds: ['s3'], timeSlots: [slotMon] };
    const c2 = { bookId: 'b2', teacherId: 't2', studentIds: ['s3', 's4', 's5'], timeSlots: [slotAfternoon] };
    const input = [
      { candidate: c1, totalScore: 50, reasons: [] },
      { candidate: c2, totalScore: 40, reasons: [] }
    ];
    const { accepted } = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted).toHaveLength(2);
    expect(accepted[1].studentIds).toEqual(['s3', 's4', 's5']); // s3 is not removed
  });

  it('Teacher conflict remains atomic', () => {
    const optimizer = new Optimizer();
    const c1 = { bookId: 'b1', teacherId: 't1', studentIds: ['s1'], timeSlots: [slotMon] };
    const c2 = { bookId: 'b2', teacherId: 't1', studentIds: ['s2', 's3'], timeSlots: [slotMon] };
    const input = [
      { candidate: c1, totalScore: 50, reasons: [] },
      { candidate: c2, totalScore: 40, reasons: [] }
    ];
    const { accepted } = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toBe(c1);
  });
});
`;

fs.writeFileSync('src/domain/services/scheduling-engine/pipeline/__tests__/optimizer.test.ts', content);
