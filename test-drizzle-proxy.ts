import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { eq } from 'drizzle-orm';

const testTable = sqliteTable('test', {
  c: text('c'),
  b: text('b'),
  a: text('a'),
});

const mockTauriSelect = async () => {
  // Tauri returns an array of objects
  return [
    { a: 'valA', b: 'valB', c: 'valC' }
  ];
};

const db = drizzle(async (sql, params, method) => {
  console.log("Drizzle query:", sql);
  const result = await mockTauriSelect();
  return { rows: result.map(Object.values) };
});

async function run() {
  const data = await db.select().from(testTable);
  console.log("Mapped by Drizzle:", data);
}

run().catch(console.error);
