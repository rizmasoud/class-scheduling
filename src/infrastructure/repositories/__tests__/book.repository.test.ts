import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './db-setup';
import { BookRepository } from '../book.repository';
import { Book } from '@/domain/models';

describe('BookRepository', () => {
  let db: any;
  let repo: BookRepository;

  beforeEach(() => {
    db = createTestDb();
    repo = new BookRepository(db);
  });

  const sampleBook: Book = {
    id: 'book-1',
    name: 'Test Book 1',
    level: 1,
    sequenceOrder: 1,
    sessionCount: 12,
  };

  it('should save and find a book by id', async () => {
    const saved = await repo.save(sampleBook);
    expect(saved).toEqual(sampleBook);

    const found = await repo.findById('book-1');
    expect(found).toEqual(sampleBook);
  });

  it('should return null for invalid ID', async () => {
    const found = await repo.findById('non-existent');
    expect(found).toBeNull();
  });

  it('should update an existing book', async () => {
    await repo.save(sampleBook);
    
    const updatedBook = { ...sampleBook, name: 'Updated Book 1', sessionCount: 15 };
    const saved = await repo.save(updatedBook);
    
    expect(saved.name).toBe('Updated Book 1');

    const found = await repo.findById('book-1');
    expect(found?.name).toBe('Updated Book 1');
    expect(found?.sessionCount).toBe(15);
  });

  it('should soft delete (archive) a book', async () => {
    await repo.save(sampleBook);
    await repo.archive('book-1');

    // Archive should not delete the record physically
    const found = await repo.findById('book-1');
    expect(found).toBeDefined();

    // findAllActive should filter out archived books
    const activeBooks = await repo.findAllActive();
    expect(activeBooks).toHaveLength(0);

    // findAll should still return it
    const allBooks = await repo.findAll();
    expect(allBooks).toHaveLength(1);
  });

  it('should retrieve multiple books', async () => {
    await repo.save({ ...sampleBook, id: 'b1' });
    await repo.save({ ...sampleBook, id: 'b2' });
    await repo.save({ ...sampleBook, id: 'b3' });

    const many = await repo.findMany(['b1', 'b3', 'missing']);
    expect(many).toHaveLength(2);
    expect(many.map(b => b.id)).toContain('b1');
    expect(many.map(b => b.id)).toContain('b3');
  });

  it('findMany should return empty array when passed empty array', async () => {
    const many = await repo.findMany([]);
    expect(many).toHaveLength(0);
  });
});
