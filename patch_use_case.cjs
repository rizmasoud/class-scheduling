const fs = require('fs');

let path = 'src/application/use-cases/proposals/generate-proposal.use-case.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `    return this.proposalRepository.save(proposal);`,
  `    if (!proposal.classes || proposal.classes.length === 0) {
      return proposal;
    }
    return this.proposalRepository.save(proposal);`
);
fs.writeFileSync(path, code);

console.log('patched generate-proposal.use-case.ts');
