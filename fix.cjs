const fs = require('fs');
let content = fs.readFileSync('src/application/use-cases/students/__tests__/promote-student.use-case.test.ts', 'utf8');

// The previous test block was missing `  });` at the end
content = content.replace(
  /\.rejects\.toThrow\('No next book available for promotion\.'\);\n  it/g,
  ".rejects.toThrow('No next book available for promotion.');\n  });\n\n  it"
);

fs.writeFileSync('src/application/use-cases/students/__tests__/promote-student.use-case.test.ts', content);
