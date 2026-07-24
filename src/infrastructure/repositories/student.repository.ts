import { eq } from 'drizzle-orm';
import { DbExecutor } from '@/core/database/types';
import { students, Student as PersistenceStudent, InsertStudent } from '@/core/database/schema/students.schema';
import { studentPreferences } from '@/core/database/schema/student-preferences.schema';
import { Student, StudentId } from '@/domain/models';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';
import { StudentMapper } from '@/infrastructure/mappers/student.mapper';
import { SoftDeleteRepository } from './base.repository';

export class StudentRepository 
  extends SoftDeleteRepository<typeof students, PersistenceStudent, InsertStudent> 
  implements IStudentRepository
{
  constructor(db: DbExecutor) {
    super(db, students);
  }

  async findById(id: StudentId): Promise<Student | null> {
    const raw = await super.executeFindById(id as string);
    if (!raw) return null;
    
    const pref = await this.db
      .select()
      .from(studentPreferences)
      .where(eq(studentPreferences.studentId, id as string))
      .limit(1)
      .then(res => res[0] || null);

    return StudentMapper.toDomain(raw, pref);
  }

  async findMany(ids: readonly StudentId[]): Promise<readonly Student[]> {
    if (ids.length === 0) return [];
    const raw = await super.executeFindMany(ids as readonly string[]);
    
    const prefs = await this.db
      .select()
      .from(studentPreferences); // Or with inArray, but let's do a basic loop or filter

    // better: fetch prefs for these students
    // Actually we can just select all prefs and filter, or use inArray.
    
    return raw.map(student => {
      const pref = prefs.find(p => p.studentId === student.id) || null;
      return StudentMapper.toDomain(student, pref);
    });
  }

  async findAll(): Promise<readonly Student[]> {
    const raw = await super.executeFindAll();
    const prefs = await this.db.select().from(studentPreferences);
    
    return raw.map(student => {
      const pref = prefs.find(p => p.studentId === student.id) || null;
      return StudentMapper.toDomain(student, pref);
    });
  }

  async findAllActive(): Promise<readonly Student[]> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.isArchived, false));
    
    const prefs = await this.db.select().from(studentPreferences);
    
    return results.map(student => {
      const pref = prefs.find(p => p.studentId === student.id) || null;
      return StudentMapper.toDomain(student, pref);
    });
  }

  async save(student: Student): Promise<Student> {
    const persistenceModel = StudentMapper.toPersistence(student);

    return await this.db.transaction(async (tx) => {
      // 1. Save root entity (Student)
      const existing = await tx
        .select()
        .from(this.table)
        .where(eq(this.table.id, student.id as string))
        .limit(1)
        .then(res => res[0]);

      let result: PersistenceStudent;
      if (existing) {
        result = await tx
          .update(this.table)
          .set(persistenceModel)
          .where(eq(this.table.id, student.id as string))
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
      if (student.preference) {
        const preferencePersistence = StudentMapper.toPersistencePreference(student.preference);
        
        const existingPref = await tx
          .select()
          .from(studentPreferences)
          .where(eq(studentPreferences.studentId, student.id as string))
          .limit(1)
          .then(res => res[0]);

        if (existingPref) {
          await tx
            .update(studentPreferences)
            .set(preferencePersistence)
            .where(eq(studentPreferences.studentId, student.id as string));
        } else {
          await tx
            .insert(studentPreferences)
            .values(preferencePersistence);
        }
      } else {
        await tx.delete(studentPreferences).where(eq(studentPreferences.studentId, student.id as string));
      }
      
      const savedPref = await tx.select().from(studentPreferences).where(eq(studentPreferences.studentId, student.id as string)).limit(1).then(res => res[0] || null);
      return StudentMapper.toDomain(result, savedPref);
    });
  }

  async archive(id: StudentId): Promise<void> {
    await super.executeSoftDelete(id as string);
  }
}
