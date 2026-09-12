import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import * as schema from '../infrastructure/database/schema';

@Injectable()
export class TeachersService {
  constructor(@Inject('PG_CONNECTION') private db: any) {}

  async findAll() {
    return this.db.select().from(schema.teachers);
  }

  async findOne(id: string) {
    const [teacher] = await this.db.select().from(schema.teachers).where(eq(schema.teachers.id, id));
    if (!teacher) throw new NotFoundException('Teacher not found');
    return teacher;
  }

  async updateProfile(id: string, requesterUserId: string, requesterRole: string, data: Partial<{ notes: string; baseRatePerSession: number }>) {
    // RBAC logic here - teacher can only update own profile, but only permitted fields (notes).
    // Supervisor can update all.
    const teacher = await this.findOne(id);
    
    if (requesterRole === 'Teacher' && teacher.userId !== requesterUserId) {
      throw new ForbiddenException('Cannot manage other teachers');
    }

    // Teachers cannot update baseRatePerSession
    if (requesterRole === 'Teacher' && data.baseRatePerSession !== undefined) {
      throw new ForbiddenException('Teachers cannot modify their base rate');
    }

    const [updated] = await this.db.update(schema.teachers)
      .set(data)
      .where(eq(schema.teachers.id, id))
      .returning();
    
    return updated;
  }

  // Skills
  async getSkills(teacherId: string) {
    return this.db.select().from(schema.teacherSkills).where(eq(schema.teacherSkills.teacherId, teacherId));
  }

  async addSkill(teacherId: string, bookId: string, requesterUserId: string, requesterRole: string) {
    const teacher = await this.findOne(teacherId);
    if (requesterRole === 'Teacher' && teacher.userId !== requesterUserId) {
      throw new ForbiddenException('Cannot manage other teachers');
    }

    const [skill] = await this.db.insert(schema.teacherSkills).values({
      teacherId,
      bookId,
    }).returning();
    return skill;
  }

  async removeSkill(teacherId: string, skillId: string, requesterUserId: string, requesterRole: string) {
    const teacher = await this.findOne(teacherId);
    if (requesterRole === 'Teacher' && teacher.userId !== requesterUserId) {
      throw new ForbiddenException('Cannot manage other teachers');
    }

    const [skill] = await this.db.delete(schema.teacherSkills)
      .where(and(eq(schema.teacherSkills.id, skillId), eq(schema.teacherSkills.teacherId, teacherId)))
      .returning();
      
    if (!skill) throw new NotFoundException('Skill not found');
    return skill;
  }
}
