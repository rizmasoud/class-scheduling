const fs = require('fs');

const path = 'src/domain/services/scheduling-engine/pipeline/time-slot-generator.ts';
let code = fs.readFileSync(path, 'utf-8');

// replace isSlotOccupied check
code = code.replace(
  `        if (!this.isSlotOccupied(slot, context)) {
          timeSlots.push(slot);
        }`,
  `        timeSlots.push(slot);`
);

// remove isSlotOccupied method entirely
code = code.replace(/  private isSlotOccupied[\\s\\S]*?  }/, '');

fs.writeFileSync(path, code);
console.log('rewritten time slot generator');
