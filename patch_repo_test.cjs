const fs = require('fs');
let path = 'src/infrastructure/repositories/__tests__/proposal.repository.test.ts';
let code = fs.readFileSync(path, 'utf8');

const orderTest = `
  it('should return active proposals ordered by createdAt DESC', async () => {
    // We cannot easily manipulate createdAt in SQLite tests without raw queries or mocking if it defaults to CURRENT_TIMESTAMP
    // Instead we can insert sequentially and rely on the fact that SQLite CURRENT_TIMESTAMP has some resolution,
    // or just mock the db behavior. 
    // Wait, Drizzle SQLite doesn't let us explicitly set createdAt easily if it's default unless we pass it.
    // Let's pass different createdAt if we can, wait, schema is generatedAt.
    
    // We will just verify it compiles and runs.
    const prop1 = { ...sampleProposal, id: 'prop-old', generatedAt: '2023-01-01T00:00:00Z', classes: [] };
    const prop2 = { ...sampleProposal, id: 'prop-new', generatedAt: '2023-01-02T00:00:00Z', classes: [] };
    
    await repo.save(prop1);
    await repo.save(prop2);
    
    const activeProposals = await repo.findAllActive();
    expect(activeProposals.length).toBe(2);
    // SQLite usually increments the rowid / createdAt.
    // The second saved should be first in the array.
    expect(activeProposals[0].id).toBe('prop-new');
    expect(activeProposals[1].id).toBe('prop-old');
  });
`;

code = code.replace(/}\);\s*$/, orderTest + '});\n');
fs.writeFileSync(path, code);
console.log('patched proposal.repository.test.ts');
