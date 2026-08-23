const fs = require('fs');
const path = require('path');
const glob = require('glob');

const testFiles = glob.sync('src/application/use-cases/**/*.test.ts');

testFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // We want to add saveMany: vi.fn(), right after save: vi.fn(), or similar mock definitions.
    // Let's just do a regex replace on the mock class repository definitions.
    
    // Some are like save: vi.fn() as Mock...
    // A safe way is to add saveMany: vi.fn(), to any object that has archive: vi.fn() or findById: vi.fn() which is part of IClassRepository mock.
    // Let's just find IClassRepository = { and add saveMany: vi.fn(),
    
    content = content.replace(/IClassRepository\s*=\s*\{/g, 'IClassRepository = {\n  saveMany: vi.fn(),');
    
    // Also, if it's "const mockClassRepository = {" and typed later, 
    // let's do a more robust regex on the exact test files.
    
    // Actually, looking at the error, it says "missing in type '{ ... }' but required in type 'IClassRepository'."
    // This usually happens when we cast `as IClassRepository` or declare `: IClassRepository`.
    
    // Let's just use string replacement on known patterns:
    content = content.replace(/save:\s*vi\.fn\(\)(?!\s*,\s*saveMany)/g, 'save: vi.fn(),\n  saveMany: vi.fn()');
    content = content.replace(/save:\s*vi\.fn\(\s*\) as any/g, 'save: vi.fn() as any,\n  saveMany: vi.fn()');
    
    // We can also just replace `archive: vi.fn(),` with `archive: vi.fn(), saveMany: vi.fn(),`
    content = content.replace(/archive:\s*vi\.fn\(\)(,?)/g, 'archive: vi.fn(), saveMany: vi.fn()$1');
    
    fs.writeFileSync(file, content);
});
console.log('Fixed mocks');
