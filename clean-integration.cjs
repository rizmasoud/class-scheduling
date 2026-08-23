const fs = require('fs');
let content = fs.readFileSync('src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts', 'utf8');
content = content.replace(/console\.log\(JSON\.stringify[\s\S]*?\);\n/g, '');
fs.writeFileSync('src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts', content);
