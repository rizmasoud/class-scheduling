const fs = require('fs');

const path = 'src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts';
let code = fs.readFileSync(path, 'utf8');

const lastDescribeIdx = code.lastIndexOf('});');

const splitPoint = code.indexOf("  it('should not group students with different books together', async () => {");
if (splitPoint === -1) {
  console.log("Split point not found");
  process.exit(1);
}

// We know the tests were appended at the end of the file.
const appendedTests = code.substring(splitPoint);
let originalCode = code.substring(0, splitPoint);

// original code ends with '  });\n});\n' roughly.
originalCode = originalCode.replace(/\}\);\n?\}\);\n?$/, "  });\n");

const finalCode = originalCode + appendedTests + "\n});\n";

fs.writeFileSync(path, finalCode);

console.log("Fixed tests positioning");

