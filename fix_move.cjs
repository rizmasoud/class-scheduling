const fs = require('fs');
const path = 'src/application/use-cases/enrollments/move-student-between-classes.use-case.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/const \[savedOldClass, savedNewClass\] = await this\.classRepository\.saveMany\(\[updatedOldClass, updatedNewClass\]\);/g, 'const savedOldClass = await this.classRepository.save(updatedOldClass);\n    const savedNewClass = await this.classRepository.save(updatedNewClass);');

fs.writeFileSync(path, content);
