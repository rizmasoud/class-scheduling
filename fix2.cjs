const fs = require('fs');

const path = 'src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts';
let code = fs.readFileSync(path, 'utf8');

const splitPoint = code.indexOf("  it('should not group students with different books together', async () => {");
if (splitPoint !== -1) {
    let original = code.substring(0, splitPoint);
    let tests = code.substring(splitPoint);
    
    // Clean original from any closing describe block brackets at the very end
    original = original.replace(/\s*\}\);\s*$/, "\n");
    
    // Clean tests from any closing describe block brackets at the very end
    tests = tests.replace(/\s*\}\);\s*$/, "\n");
    tests = tests.replace(/\s*\}\);\s*$/, "\n"); // just in case
    
    // Re-assemble
    // also fix the `.students` to `.studentIds` in tests
    tests = tests.replace(/chunk1\.students!\.length/g, "chunk1.studentIds!.length");
    
    // also fix the maxWeeklySessions issue
    tests = tests.replace(/unavailableTimeRanges: \[\],\n\s*notes: null/g, "unavailableTimeRanges: [],\n        notes: null,\n        maxWeeklySessions: 10");
    
    fs.writeFileSync(path, original + tests + "  });\n});\n");
}
