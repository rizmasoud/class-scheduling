const fs = require('fs');
const path = 'src/application/use-cases/enrollments/move-student-between-classes.use-case.ts';
let content = fs.readFileSync(path, 'utf8');

const target = `    if (!this.classRepository.saveMany) {
      const savedOldClass = await this.classRepository.save(updatedOldClass);
      const savedNewClass = await this.classRepository.save(updatedNewClass);
      return { oldClass: savedOldClass, newClass: savedNewClass };
    }

    const [savedOldClass, savedNewClass] = await this.classRepository.saveMany([updatedOldClass, updatedNewClass]);`;

const target_minified = `    if (!this.classRepository.saveMany) {\n      const savedOldClass = await this.classRepository.save(updatedOldClass);\n      const savedNewClass = await this.classRepository.save(updatedNewClass);\n      return { oldClass: savedOldClass, newClass: savedNewClass };\n    }\n\n    const [savedOldClass, savedNewClass] = await this.classRepository.saveMany([updatedOldClass, updatedNewClass]);`;

const replacement = `    const [savedOldClass, savedNewClass] = await this.classRepository.saveMany([updatedOldClass, updatedNewClass]);`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
} else if (content.includes(target_minified)) {
    content = content.replace(target_minified, replacement);
    fs.writeFileSync(path, content);
} else {
    // Try a regex just in case
    content = content.replace(/if\s*\(!this\.classRepository\.saveMany\)\s*\{\s*const savedOldClass = await this\.classRepository\.save\(updatedOldClass\);\s*const savedNewClass = await this\.classRepository\.save\(updatedNewClass\);\s*return \{ oldClass: savedOldClass, newClass: savedNewClass \};\s*\}\s*const \[savedOldClass, savedNewClass\] = await this\.classRepository\.saveMany\(\[updatedOldClass, updatedNewClass\]\);/g, replacement);
    fs.writeFileSync(path, content);
}

