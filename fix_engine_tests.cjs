const fs = require('fs');

let path = 'src/domain/services/scheduling-engine/__tests__/scheduling-engine.test.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `vi.mocked(mockCandidateGenerator.generate).mockReturnValue(fakeCandidates);`,
  `vi.mocked(mockCandidateGenerator.generate).mockReturnValue({ candidates: fakeCandidates, rejectionReasons: new Map() });`
);
code = code.replace(
  `vi.mocked(mockOptimizer.optimize).mockReturnValue(fakeOptimized);`,
  `vi.mocked(mockOptimizer.optimize).mockReturnValue({ accepted: fakeOptimized, rejectionReasons: new Map() });`
);
code = code.replace(
  `vi.mocked(mockCandidateGenerator.generate).mockReturnValue([fakeCandidate]);`,
  `vi.mocked(mockCandidateGenerator.generate).mockReturnValue({ candidates: [fakeCandidate], rejectionReasons: new Map() });`
);
code = code.replace(
  `vi.mocked(mockOptimizer.optimize).mockReturnValue([]);`,
  `vi.mocked(mockOptimizer.optimize).mockReturnValue({ accepted: [], rejectionReasons: new Map() });`
);

fs.writeFileSync(path, code);
console.log('fixed engine tests');
