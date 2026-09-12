const fs = require('fs');
const file = 'apps/api/src/app.module.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('SchedulingModule')) {
  code = code.replace("import { TeachersModule } from './teachers/teachers.module';",
    "import { TeachersModule } from './teachers/teachers.module';\nimport { SchedulingModule } from './scheduling/scheduling.module';");
  
  code = code.replace("TeachersModule,", "TeachersModule,\n    SchedulingModule,");
}

fs.writeFileSync(file, code);
