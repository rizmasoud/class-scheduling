import { eq, and, notInArray } from 'drizzle-orm';
import { DbExecutor } from '@/core/database/types';
import { teachers, Teacher as PersistenceTeacher, InsertTeacher } from '@/core/database/schema/teachers.schema';
import { teacherPreferences } from '@/core/database/schema/teacher-preferences.schema';
import { teacherSkills } from '@/core/database/schema/teacher-skills.schema';
import { Teacher, TeacherId } from '@/domain/models';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';
import { TeacherMapper } from '@/infrastructure/mappers/teacher.mapper';
import { SoftDeleteRepository } from './base.repository';

export class TeacherRepository 
  extends SoftDeleteRepository<typeof teachers, PersistenceTeacher, InsertTeacher> 
  implements ITeacherRepository
{
  constructor(db: DbExecutor) {
    super(db, teachers);
  }

  async findById(id: TeacherId): Promise<Teacher | null> {
    const raw = await super.executeFindById(id as string);
    if (!raw) return null;
    
    const pref = await this.db
      .select()
      .from(teacherPreferences)
      .where(eq(teacherPreferences.teacherId, id as string))
      .limit(1)
      .then(res => res[0] || null);
      
    const skills = await this.db
      .select()
      .from(teacherSkills)
      .where(eq(teacherSkills.teacherId, id as string));

    return TeacherMapper.toDomain(raw, pref, skills);
  }

  async findMany(ids: readonly TeacherId[]): Promise<readonly Teacher[]> {
    if (ids.length === 0) return [];
    const raw = await super.executeFindMany(ids as readonly string[]);
    
    const prefs = await this.db.select().from(teacherPreferences);
    const skills = await this.db.select().from(teacherSkills);
    
    return raw.map(teacher => {
      const pref = prefs.find(p => p.teacherId === teacher.id) || null;
      const sks = skills.filter(s => s.teacherId === teacher.id);
      return TeacherMapper.toDomain(teacher, pref, sks);
    });
  }

  async findAll(): Promise<readonly Teacher[]> {
    const raw = await super.executeFindAll();
    const prefs = await this.db.select().from(teacherPreferences);
    const skills = await this.db.select().from(teacherSkills);
    
    return raw.map(teacher => {
      const pref = prefs.find(p => p.teacherId === teacher.id) || null;
      const sks = skills.filter(s => s.teacherId === teacher.id);
      return TeacherMapper.toDomain(teacher, pref, sks);
    });
  }

  async findAllActive(): Promise<readonly Teacher[]> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.isArchived, false));
    
    const prefs = await this.db.select().from(teacherPreferences);
    const skills = await this.db.select().from(teacherSkills);
    
    return results.map(teacher => {
      const pref = prefs.find(p => p.teacherId === teacher.id) || null;
      const sks = skills.filter(s => s.teacherId === teacher.id);
      return TeacherMapper.toDomain(teacher, pref, sks);
    });
  }

  async save(teacher: Teacher): Promise<Teacher> {
    const persistenceModel = TeacherMapper.toPersistence(teacher);

    return await this.db.transaction(async (tx) => {
      // 1. Save root entity (Teacher)
      const existing = await tx
        .select()
        .from(this.table)
        .where(eq(this.table.id, teacher.id as string))
        .limit(1)
        .then(res => res[0]);

      let result: PersistenceTeacher;
      if (existing) {
        result = await tx
          .update(this.table)
          .set(persistenceModel)
          .where(eq(this.table.id, teacher.id as string))
          .returning()
          .then(res => res[0]);
      } else {
        result = await tx
          .insert(this.table)
          .values(persistenceModel)
          .returning()
          .then(res => res[0]);
      }

      // 2. Save preference if provided
      if (teacher.preference) {
        const preferencePersistence = TeacherMapper.toPersistencePreference(teacher.preference);
        
        const existingPref = await tx
          .select()
          .from(teacherPreferences)
          .where(eq(teacherPreferences.teacherId, teacher.id as string))
          .limit(1)
          .then(res => res[0]);

        if (existingPref) {
          await tx
            .update(teacherPreferences)
            .set(preferencePersistence)
            .where(eq(teacherPreferences.teacherId, teacher.id as string));
        } else {
          await tx
            .insert(teacherPreferences)
            .values(preferencePersistence);
        }
      } else {
         await tx.delete(teacherPreferences).where(eq(teacherPreferences.teacherId, teacher.id as string));
      }
      
      // 3. Save skills if provided
      if (teacher.skills) {
        const currentSkillIds = teacher.skills.map(s => s.id as string);
        if (currentSkillIds.length > 0) {
          await tx.delete(teacherSkills).where(and(eq(teacherSkills.teacherId, teacher.id as string), notInArray(teacherSkills.id, currentSkillIds)));
        } else {
          await tx.delete(teacherSkills).where(eq(teacherSkills.teacherId, teacher.id as string));
        }

        for (const skill of teacher.skills) {
          const skillPersistence = TeacherMapper.toPersistenceSkill(skill);
          const existingSkill = await tx
            .select()
            .from(teacherSkills)
            .where(eq(teacherSkills.id, skill.id as string))
            .limit(1)
            .then(res => res[0]);

          if (existingSkill) {
            await tx
              .update(teacherSkills)
              .set(skillPersistence)
              .where(eq(teacherSkills.id, skill.id as string));
          } else {
            await tx
              .insert(teacherSkills)
              .values(skillPersistence);
          }
        }
      } else {
         await tx.delete(teacherSkills).where(eq(teacherSkills.teacherId, teacher.id as string));
      }
      const savedPref = await tx.select().from(teacherPreferences).where(eq(teacherPreferences.teacherId, teacher.id as string)).limit(1).then(res => res[0] || null);
      const savedSkills = await tx.select().from(teacherSkills).where(eq(teacherSkills.teacherId, teacher.id as string));
      return TeacherMapper.toDomain(result, savedPref, savedSkills);
    });
  }

  async archive(id: TeacherId): Promise<void> {
    await super.executeSoftDelete(id as string);
  }
}
