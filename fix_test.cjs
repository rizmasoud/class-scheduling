const fs = require('fs');
let path = 'src/application/use-cases/proposals/__tests__/generate-proposal.use-case.test.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `status: 'Draft', score: 10, reasons: []`,
  `status: 'Pending', score: 10, reasons: []`
);

fs.writeFileSync(path, code);
console.log('Fixed test status type');
