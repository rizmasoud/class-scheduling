const fs = require('fs');
const file = 'apps/api/src/infrastructure/database/schema.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace("updatedAt: timestamp('updated_at').defaultNow().notNull(),\n});",
`updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  draftUniqueIndex: import('drizzle-orm').then(m => m.uniqueIndex('draft_proposal_term_idx').on(t.termId).where(m.sql\`status = 'Draft'\`))
}));`);
// Actually, uniqueIndex import is tricky with top level require. Let's just write the correct code.
