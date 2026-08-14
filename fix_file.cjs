const fs = require('fs');
let code = fs.readFileSync('src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts', 'utf8');

const splitPoint = code.indexOf("  it('should not group students with different books together', async () => {");
if (splitPoint !== -1) {
    let original = code.substring(0, splitPoint);
    let tests = code.substring(splitPoint);
    // remove trailing }); from tests just in case
    tests = tests.replace(/\}\);\n?\}\);\n?$/, "  });\n");
    // remove trailing }); from original
    original = original.replace(/\}\);\n?\}\);\n?$/, "");
    // wait, what if original didn't have it? We just find the last describe closing brace
    
    // Better strategy:
    // we want all `it` blocks to be inside the describe block.
    // The describe block starts at `describe('GenerateProposalUseCase (Integration)'`
    
    // I will just use regex to remove any trailing `});` from original and then append `tests`, then add a single `});`
}

