const fs = require('fs');
const glob = require('glob');

const testFiles = glob.sync('src/application/use-cases/**/*.test.ts');

testFiles.forEach(file => {
    if (file.includes('import-students.use-case.test.ts')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/saveMany:\s*vi\.fn\(\)\s*,\s*/g, '');
    content = content.replace(/saveMany:\s*vi\.fn\(\)\s*/g, '');
    fs.writeFileSync(file, content);
});
console.log('Cleaned up mocks');
