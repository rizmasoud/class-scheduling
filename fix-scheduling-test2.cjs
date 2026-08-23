const fs = require('fs');
let content = fs.readFileSync('src/domain/services/scheduling-engine/__tests__/scheduling-engine.test.ts', 'utf8');

content = content.replace(/endTime: '12:00' \}\n      \};/g, "endTime: '12:00' }]\n      };");

fs.writeFileSync('src/domain/services/scheduling-engine/__tests__/scheduling-engine.test.ts', content);
