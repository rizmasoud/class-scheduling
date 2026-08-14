const fs = require('fs');
const file = 'src/core/database/migrations/0001_panoramic_bloodstorm.sql';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'CREATE TABLE `proposal_unscheduled_students`',
  'CREATE TABLE IF NOT EXISTS `proposal_unscheduled_students`'
);

fs.writeFileSync(file, content);
console.log('Patched migration');
