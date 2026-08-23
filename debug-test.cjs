const fs = require('fs');
let content = fs.readFileSync('src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts', 'utf8');

content = content.replace("expect(hasBookA).toBe(true);",
`console.log(JSON.stringify(result.classes!.map(c => ({ bookId: c.bookId, students: c.studentIds })), null, 2));
    expect(hasBookA).toBe(true);`);

fs.writeFileSync('src/application/use-cases/proposals/__tests__/generate-proposal.integration.test.ts', content);
