const fs = require('fs');
let content = fs.readFileSync('src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts', 'utf8');

content = content.replace("expect(result.classes![0].bookId).not.toBe(result.classes![1].bookId);",
`const hasBookA = result.classes!.some(c => c.bookId === 'book-A');
    const hasBookB = result.classes!.some(c => c.bookId === 'book-B');
    expect(hasBookA).toBe(true);
    expect(hasBookB).toBe(true);
    for (const cls of result.classes!) {
      expect(cls.studentIds!.length).toBeGreaterThan(0);
    }`);

fs.writeFileSync('src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts', content);
