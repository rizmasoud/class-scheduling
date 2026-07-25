const fs = require('fs');
const content = fs.readFileSync('src/infrastructure/repositories/class.repository.ts', 'utf8');

const newContent = content.replace(
  "import { DbExecutor } from '@/core/database/types';",
  "import { DbExecutor, AppTransaction } from '@/core/database/types';"
).replace(
  "async save(classData: Class): Promise<Class> {",
  `async save(classData: Class): Promise<Class> {
    return await this.db.transaction(async (tx) => {
      return this._saveTx(tx, classData);
    });
  }

  async saveMany(classes: readonly Class[]): Promise<readonly Class[]> {
    return await this.db.transaction(async (tx) => {
      const results: Class[] = [];
      for (const classData of classes) {
        results.push(await this._saveTx(tx, classData));
      }
      return results;
    });
  }

  private async _saveTx(tx: any, classData: Class): Promise<Class> {`
).replace(
  "return await this.db.transaction(async (tx) => {",
  ""
);

// We need to fix the closing braces.
// The original `save` method had `});` at the very end of `return await this.db.transaction`.
// Let's just find and replace the whole block more reliably.
