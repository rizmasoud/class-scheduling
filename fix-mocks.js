const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p, callback);
    } else if (p.endsWith('.test.ts')) {
      callback(p);
    }
  }
}

walk('src', (p) => {
  let content = fs.readFileSync(p, 'utf-8');
  // First, completely remove all `saveMany: vi.fn(),` or `saveMany: vi.fn()`
  content = content.replace(/saveMany:\s*vi\.fn\(\),?/g, '');
  
  // Now we need to add `saveMany: vi.fn(),` ONLY where `IStudentRepository` is mocked.
  // We can look for `IStudentRepository = {` and inject it.
  content = content.replace(/(:\s*IStudentRepository\s*=\s*{)/g, '$1 saveMany: vi.fn(),');

  fs.writeFileSync(p, content);
});
console.log('Done fixing mocks');
