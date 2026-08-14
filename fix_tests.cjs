const fs = require('fs');

function replaceInFile(path, search, replace) {
  let code = fs.readFileSync(path, 'utf8');
  code = code.split(search).join(replace);
  fs.writeFileSync(path, code);
}

function replaceRegexInFile(path, regex, replace) {
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(regex, replace);
  fs.writeFileSync(path, code);
}

// 1. Candidate generator
let candidateTest = 'src/domain/services/scheduling-engine/pipeline/__tests__/candidate-generator.test.ts';
replaceInFile(candidateTest, 
  `const candidates = generator.generate(context, timeSlots, config);`,
  `const { candidates } = generator.generate(context, timeSlots, config);`
);

// 2. Proposal assembler test
let assemblerTest = 'src/domain/services/scheduling-engine/pipeline/__tests__/proposal-assembler.test.ts';
replaceInFile(assemblerTest, 
  `context,`, 
  `context,\n      unscheduledStudents: [],`
);
replaceRegexInFile(assemblerTest, 
  /generateProposalClassId/g,
  `generateProposalClassId` // noop just to make sure we don't break stuff
);

// 3. Engine test
let engineTest = 'src/domain/services/scheduling-engine/__tests__/scheduling-engine.test.ts';
replaceInFile(engineTest,
  `mockCandidateGenerator.generate.mockReturnValue([`,
  `mockCandidateGenerator.generate.mockReturnValue({ candidates: [`,
);
replaceInFile(engineTest,
  `      }
    ]);`,
  `      }
    ], rejectionReasons: new Map() });`
);
replaceInFile(engineTest,
  `mockOptimizer.optimize.mockReturnValue([`,
  `mockOptimizer.optimize.mockReturnValue({ accepted: [`
);
replaceInFile(engineTest,
  `      }
    ]);`,
  `      }
    ], rejectionReasons: new Map() });`
);

// 4. Optimizer test
let optimizerTest = 'src/domain/services/scheduling-engine/pipeline/__tests__/optimizer.test.ts';
replaceRegexInFile(optimizerTest,
  /const result = optimizer\.optimize\(([\s\S]*?)\);/g,
  `const { accepted: result } = optimizer.optimize($1);`
);

console.log('fixed tests');
