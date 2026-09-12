import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import * as schema from '../infrastructure/database/schema';

@Injectable()
export class StudentsService {
  constructor(@Inject('PG_CONNECTION') private db: any) {}

  async create(data: { fullName: string; externalStudentId?: string; currentBookId?: string }) {
    try {
      const [student] = await this.db.insert(schema.students).values({
        fullName: data.fullName,
        externalStudentId: data.externalStudentId,
        currentBookId: data.currentBookId,
      }).returning();
      return student;
    } catch (e: any) {
      if (e.code === '23505') { // unique violation
        throw new ConflictException('External Student ID already exists');
      }
      throw e;
    }
  }

  async findAll() {
    return this.db.select().from(schema.students);
  }

  async findOne(id: string) {
    const [student] = await this.db.select().from(schema.students).where(eq(schema.students.id, id));
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async update(id: string, data: Partial<{ fullName: string; externalStudentId: string; currentBookId: string }>) {
    try {
      const [student] = await this.db.update(schema.students)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.students.id, id))
        .returning();
      if (!student) throw new NotFoundException('Student not found');
      return student;
    } catch (e: any) {
      if (e.code === '23505') {
        throw new ConflictException('External Student ID already exists');
      }
      throw e;
    }
  }

  // Preferences
  async getPreferences(studentId: string) {
    const [pref] = await this.db.select().from(schema.studentPreferences).where(eq(schema.studentPreferences.studentId, studentId));
    if (!pref) throw new NotFoundException('Student preferences not found');
    return pref;
  }

  async upsertPreferences(studentId: string, data: { availableDayPattern: string; unavailableTimeRanges: any }) {
    const [existing] = await this.db.select().from(schema.studentPreferences).where(eq(schema.studentPreferences.studentId, studentId));
    if (existing) {
      const [updated] = await this.db.update(schema.studentPreferences)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.studentPreferences.studentId, studentId))
        .returning();
      return updated;
    } else {
      const [created] = await this.db.insert(schema.studentPreferences).values({
        studentId,
        availableDayPattern: data.availableDayPattern,
        unavailableTimeRanges: data.unavailableTimeRanges,
      }).returning();
      return created;
    }
  }
}
