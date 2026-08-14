const fs = require('fs');
const file = 'src/domain/services/scheduling-engine/pipeline/__tests__/candidate-generator.test.ts';
let content = fs.readFileSync(file, 'utf8');

// replace the assertions in "splits group if size exceeds maximum capacity"
content = content.replace(
  `// Should split 31 students into 15, 15, and 1
    expect(candidates).toHaveLength(3);
    
    // Check sizes of the studentIds arrays in generated candidates
    const groupSizes = candidates.map(c => c.studentIds.length);
    expect(groupSizes).toEqual([15, 15, 1]);
    
    // Make sure we preserve ordering
    expect(candidates[0].studentIds[0]).toBe('st0');
    expect(candidates[0].studentIds[14]).toBe('st14');
    expect(candidates[1].studentIds[0]).toBe('st15');
    expect(candidates[1].studentIds[14]).toBe('st29');
    expect(candidates[2].studentIds[0]).toBe('st30');`,
  `// Should generate full chunks and then single-student fallbacks for chunks > 1
    // Total candidates: 
    // chunk 1 (size 15) -> 1 + 15
    // chunk 2 (size 15) -> 1 + 15
    // chunk 3 (size 1) -> 1
    // 16 + 16 + 1 = 33
    expect(candidates).toHaveLength(33);
    
    // Check sizes of the studentIds arrays in generated candidates
    const groupSizes = candidates.map(c => c.studentIds.length);
    // the first candidate is the chunk of 15
    expect(groupSizes[0]).toEqual(15);
    // followed by 15 single-student candidates
    for (let i = 1; i <= 15; i++) {
      expect(groupSizes[i]).toEqual(1);
    }
    // then the next chunk of 15
    expect(groupSizes[16]).toEqual(15);
    // followed by 15 single-student candidates
    for (let i = 17; i <= 31; i++) {
      expect(groupSizes[i]).toEqual(1);
    }
    // then the final chunk of 1
    expect(groupSizes[32]).toEqual(1);
    
    // Make sure we preserve ordering
    expect(candidates[0].studentIds[0]).toBe('st0');
    expect(candidates[0].studentIds[14]).toBe('st14');
    expect(candidates[16].studentIds[0]).toBe('st15');
    expect(candidates[16].studentIds[14]).toBe('st29');
    expect(candidates[32].studentIds[0]).toBe('st30');`
);

fs.writeFileSync(file, content);
console.log('Patched test');
