import re
with open("src/infrastructure/repositories/class.repository.ts", "r") as f:
    content = f.read()

content = content.replace(
    "import { DbExecutor } from '@/core/database/types';",
    "import { DbExecutor, AppTransaction } from '@/core/database/types';"
)

save_method_start = content.find("  async save(classData: Class): Promise<Class> {")
archive_method_start = content.find("  async archive(id: ClassId): Promise<void> {")

before_save = content[:save_method_start]
after_save = content[archive_method_start:]
save_body = content[save_method_start:archive_method_start]

# We need to extract the inner of `return await this.db.transaction(async (tx) => {`
inner_start = save_body.find("return await this.db.transaction(async (tx) => {")
inner_start += len("return await this.db.transaction(async (tx) => {")

inner_body = save_body[inner_start:]
# strip the last `});` and spaces
inner_body = inner_body.rstrip()
if inner_body.endswith("});"):
    inner_body = inner_body[:-3].rstrip()
if inner_body.endswith("}"):
    inner_body = inner_body[:-1].rstrip()

new_methods = """  async save(classData: Class): Promise<Class> {
    return await this.db.transaction(async (tx: any) => {
      return this._saveTx(tx, classData);
    });
  }

  async saveMany(classes: readonly Class[]): Promise<readonly Class[]> {
    return await this.db.transaction(async (tx: any) => {
      const results: Class[] = [];
      for (const classData of classes) {
        results.push(await this._saveTx(tx, classData));
      }
      return results;
    });
  }

  private async _saveTx(tx: any, classData: Class): Promise<Class> {
    const persistenceModel = ClassMapper.toPersistence(classData);
""" + inner_body + """
  }

"""

with open("src/infrastructure/repositories/class.repository.ts", "w") as f:
    f.write(before_save + new_methods + after_save)
