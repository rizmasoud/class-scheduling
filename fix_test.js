const fs = require('fs');
let code = fs.readFileSync('src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts', 'utf8');

// Find the last closing brace and move the newly appended tests inside the describe block
// Actually, it's easier to remove the tests from the end and insert them before the last `});`
const testsContent = code.substring(code.indexOf("  it('should not group students with different books together', async () => {"));
const originalCode = code.substring(0, code.indexOf("  it('should not group students with different books together', async () => {"));

// originalCode ends with `  });\n});\n` or something similar.
const newCode = originalCode.replace(/\}\);\n$/, testsContent + "\n});\n");

fs.writeFileSync('src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts', newCode);
