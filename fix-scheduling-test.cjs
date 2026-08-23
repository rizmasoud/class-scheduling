const fs = require('fs');
let content = fs.readFileSync('src/domain/services/scheduling-engine/__tests__/scheduling-engine.test.ts', 'utf8');

content = content.replace(/timeSlots: \[ \{ id: 'slot-1', weekDay: 'Monday', startTime: '10:00', endTime: '12:00' \}\n      \};/g, "timeSlots: [{ id: 'slot-1', weekDay: 'Monday', startTime: '10:00', endTime: '12:00' }]\n      };");

fs.writeFileSync('src/domain/services/scheduling-engine/__tests__/scheduling-engine.test.ts', content);
