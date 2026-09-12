const fs = require('fs');
const file = 'apps/api/src/infrastructure/database/schema.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
`}, (t) => ({
  draftUniqueIdx: uniqueIndex('draft_proposal_term_idx').on(t.termId).where(sql\`status = 'Draft'\`),
}));`,
`});`);

code = code.replace(
`  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const proposalClasses = pgTable('proposal_classes', {`,
`  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  draftUniqueIdx: uniqueIndex('draft_proposal_term_idx').on(t.termId).where(sql\`status = 'Draft'\`),
}));

export const proposalClasses = pgTable('proposal_classes', {`);

fs.writeFileSync(file, code);
