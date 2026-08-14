const fs = require('fs');

let path = 'src/domain/services/scheduling-engine/pipeline/__tests__/optimizer.test.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/const accepted = optimizer\.optimize/g, 'const { accepted } = optimizer.optimize');
code = code.replace(/expect\(accepted\)\.toHaveLength\(/g, 'expect(accepted).toHaveLength(');

fs.writeFileSync(path, code);
console.log('fixed optimizer tests');
