const fs = require('fs');

let path = 'src/domain/services/scheduling-engine/pipeline/__tests__/candidate-generator.test.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/expect\(candidates\)\./g, 'expect(candidates.candidates || candidates).');
// because if candidates is the object, candidates.candidates exists.
// wait, if I use `const { candidates }`, then candidates IS the array. Let's just undo the previous replace and do it right.

code = code.replace(/const \{ candidates \} \= generator\.generate/g, 'const candidates = generator.generate');
// now candidates is the returned object.
code = code.replace(/expect\(candidates\)\./g, 'expect(candidates.candidates).');
fs.writeFileSync(path, code);


let optPath = 'src/domain/services/scheduling-engine/pipeline/__tests__/optimizer.test.ts';
let optCode = fs.readFileSync(optPath, 'utf8');
optCode = optCode.replace(/const \{ accepted \} \= optimizer\.optimize/g, 'const accepted = optimizer.optimize');
optCode = optCode.replace(/expect\(accepted\)\./g, 'expect(accepted.accepted).');
optCode = optCode.replace(/expect\(accepted\[/g, 'expect(accepted.accepted[');
fs.writeFileSync(optPath, optCode);

console.log('fixed tests by unwrapping the expect');
