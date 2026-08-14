const fs = require('fs');
let path = 'src/infrastructure/repositories/proposal.repository.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('desc(')) {
  code = code.replace(/import \{ eq, and, notInArray \} from 'drizzle-orm';/, "import { eq, and, notInArray, desc } from 'drizzle-orm';");
}

code = code.replace(
  `  async findAllActive(): Promise<readonly SchedulingProposal[]> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.isArchived, false));`,
  `  async findAllActive(): Promise<readonly SchedulingProposal[]> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.isArchived, false))
      .orderBy(desc(this.table.createdAt));`
);

fs.writeFileSync(path, code);
console.log('patched proposal.repository.ts');
