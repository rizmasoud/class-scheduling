const fs = require('fs');
const file = 'apps/api/vitest.config.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace("export default defineConfig({", "export default defineConfig({\n  css: { postcss: false },");

fs.writeFileSync(file, code);
