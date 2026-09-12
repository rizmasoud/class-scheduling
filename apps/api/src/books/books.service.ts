import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '../infrastructure/database/schema';

@Injectable()
export class BooksService {
  constructor(@Inject('PG_CONNECTION') private db: any) {}

  async create(data: { title: string; level?: string; sequenceOrder: number; sessionCount: number }) {
    const [book] = await this.db.insert(schema.books).values(data).returning();
    return book;
  }

  async findAll() {
    return this.db.select().from(schema.books);
  }

  async findOne(id: string) {
    const [book] = await this.db.select().from(schema.books).where(eq(schema.books.id, id));
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async update(id: string, data: Partial<{ title: string; level: string; sequenceOrder: number; sessionCount: number }>) {
    const [book] = await this.db.update(schema.books)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.books.id, id))
      .returning();
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  // Syllabus Items
  async getSyllabus(bookId: string) {
    return this.db.select().from(schema.bookSyllabusItems).where(eq(schema.bookSyllabusItems.bookId, bookId));
  }

  async createSyllabusItem(bookId: string, data: { sessionNumber: number; topic: string; description?: string }) {
    const [item] = await this.db.insert(schema.bookSyllabusItems).values({
      bookId,
      ...data
    }).returning();
    return item;
  }

  async updateSyllabusItem(itemId: string, data: Partial<{ sessionNumber: number; topic: string; description: string }>) {
    const [item] = await this.db.update(schema.bookSyllabusItems)
      .set(data)
      .where(eq(schema.bookSyllabusItems.id, itemId))
      .returning();
    if (!item) throw new NotFoundException('Syllabus item not found');
    return item;
  }

  async deleteSyllabusItem(itemId: string) {
    const [item] = await this.db.delete(schema.bookSyllabusItems)
      .where(eq(schema.bookSyllabusItems.id, itemId))
      .returning();
    if (!item) throw new NotFoundException('Syllabus item not found');
    return item;
  }
}
