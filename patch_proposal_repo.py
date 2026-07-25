import re

with open('src/infrastructure/repositories/proposal.repository.ts', 'r') as f:
    content = f.read()

import_str = "import { Class } from '@/domain/models';\nimport { ClassRepository } from './class.repository';\n"
content = content.replace("import { SoftDeleteRepository } from './base.repository';", import_str + "import { SoftDeleteRepository } from './base.repository';")

method_str = """
  async saveWithClasses(proposal: SchedulingProposal, newClasses: readonly Class[]): Promise<void> {
    await this.db.transaction(async (tx: any) => {
      // 1. Save proposal using a transactional repository instance
      const proposalRepo = new ProposalRepository(tx);
      await proposalRepo.save(proposal);

      // 2. Save classes using a transactional repository instance
      const classRepo = new ClassRepository(tx);
      if (newClasses.length > 0) {
        await classRepo.saveMany(newClasses);
      }
    });
  }
"""

content = content.replace("async archive(id: ProposalId): Promise<void> {", method_str + "\n  async archive(id: ProposalId): Promise<void> {")

with open('src/infrastructure/repositories/proposal.repository.ts', 'w') as f:
    f.write(content)
