const fs = require('fs');
const path = 'src/application/use-cases/enrollments/__tests__/move-student-between-classes.use-case.test.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/expect\(mockClassRepo\.saveMany\)\.toHaveBeenCalledTimes\(1\);/g, 'expect(mockClassRepo.save).toHaveBeenCalledTimes(2);');

fs.writeFileSync(path, content);
