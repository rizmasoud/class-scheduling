const fs = require('fs');
let content = fs.readFileSync('src/domain/services/manual-editing/manual-proposal-editor.ts', 'utf8');

content = content.replace(/const timeSlots: \[ TimeSlot = \{[\s\S]*?\};/, `const timeSlots: TimeSlot[] = [{
      id: schedule.id,
      weekDay: schedule.weekDay,
      startTime: schedule.startTime,
      endTime: schedule.endTime
    }];`);

content = content.replace(/timeSlot\n    \};/, 'timeSlots\n    };');

fs.writeFileSync('src/domain/services/manual-editing/manual-proposal-editor.ts', content);
