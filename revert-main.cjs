const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');
code = code.replace(
  "{error.message || (typeof error === 'string' ? error : 'Failed to start the application.')}",
  "{error.message || 'Failed to start the application.'}"
);
fs.writeFileSync('src/main.tsx', code);
