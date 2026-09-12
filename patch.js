const fs = require('fs');
const file = 'apps/api/src/infrastructure/database/schema.ts';
let code = fs.readFileSync(file, 'utf8');

// replace uniqueIndex
if (!code.includes('uniqueIndex')) {
  code = code.replace("import { sql } from 'drizzle-orm';", "import { sql } from 'drizzle-orm';\nimport { uniqueIndex } from 'drizzle-orm/pg-core';");
}

code = code.replace(`updatedAt: timestamp('updated_at').defaultNow().notNull(),\n});`,
`updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  draftUniqueIdx: uniqueIndex('draft_proposal_term_idx').on(t.termId).where(sql\`status = 'Draft'\`),
}));`);

fs.writeFileSync(file, code);
