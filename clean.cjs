const fs = require('fs');
const glob = require('glob');

const testFiles = glob.sync('src/application/use-cases/**/*.test.ts');

testFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix things like `vi.fn(), .mockResolvedValue`
    content = content.replace(/vi\.fn\(\)\s*,\s*\./g, 'vi.fn().');
    
    // Fix `save: vi.fn(), as Mock`
    content = content.replace(/vi\.fn\(\)\s*,\s*as\s+any/g, 'vi.fn() as any');
    content = content.replace(/vi\.fn\(\)\s*,\s*as\s+Mock/g, 'vi.fn() as Mock');
    
    // Fix dangling commas `, ,`
    content = content.replace(/,\s*,/g, ',');
    
    fs.writeFileSync(file, content);
});
console.log('Cleaned up syntax');
