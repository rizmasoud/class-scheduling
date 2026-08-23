const fs = require('fs');
let content = fs.readFileSync('src/domain/services/scheduling-engine/pipeline/__tests__/optimizer.test.ts', 'utf8');
content = content.replace(/timeSlot:/g, 'timeSlots: [');
content = content.replace(/endTime: '10:00' }/g, "endTime: '10:00' }]");
content = content.replace(/endTime: '12:00' }/g, "endTime: '12:00' }]");
content = content.replace(/endTime: '11:00' }/g, "endTime: '11:00' }]");
content = content.replace(/}]]/g, "}]"); // fix double bracket if happened
fs.writeFileSync('src/domain/services/scheduling-engine/pipeline/__tests__/optimizer.test.ts', content);
