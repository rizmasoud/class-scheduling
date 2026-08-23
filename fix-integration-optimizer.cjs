const fs = require('fs');
let content = fs.readFileSync('src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts', 'utf8');

content = content.replace(/new Optimizer\(\),/g, "new Optimizer(new RuleEngine([])),");

fs.writeFileSync('src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts', content);
