export class MockDatabase {
  async execute(query: string, bindValues?: unknown[]): Promise<any> {
    console.log("Mock execute:", query, bindValues);
    return { lastInsertId: 0, rowsAffected: 0 };
  }
  async select<T>(query: string, bindValues?: unknown[]): Promise<T> {
    console.log("Mock select:", query, bindValues);
    return [] as unknown as T;
  }
}
