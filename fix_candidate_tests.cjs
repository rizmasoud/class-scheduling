const fs = require('fs');

let path = 'src/domain/services/scheduling-engine/pipeline/__tests__/candidate-generator.test.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/const candidates = generator\.generate\(/g, 'const { candidates } = generator.generate(');

fs.writeFileSync(path, code);

let optPath = 'src/domain/services/scheduling-engine/pipeline/__tests__/optimizer.test.ts';
let optCode = fs.readFileSync(optPath, 'utf8');
optCode = optCode.replace(/expect\(optimizer\.optimize\(\[\]\, dummyContext\)\)\.toEqual\(\[\]\)\;/g, 'expect(optimizer.optimize([], dummyContext).accepted).toEqual([]);');
fs.writeFileSync(optPath, optCode);

console.log('fixed generator tests globally');
