import { describe, it, expect } from 'vitest';
import { createTestDb } from './db-setup';

describe('Database Setup', () => {
  it('should initialize and migrate memory db', () => {
    const db = createTestDb();
    expect(db).toBeDefined();
  });
});
