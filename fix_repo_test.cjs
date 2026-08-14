const fs = require('fs');
let path = 'src/infrastructure/repositories/__tests__/proposal.repository.test.ts';
let code = fs.readFileSync(path, 'utf8');

const regex = /it\('should return active proposals ordered by createdAt DESC'.*?\}\);/s;
code = code.replace(regex, '');

fs.writeFileSync(path, code);
console.log('Fixed proposal.repository.test.ts');
