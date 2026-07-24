import { eq, and, notInArray } from 'drizzle-orm';
import { DbExecutor } from '@/core/database/types';
import { classes, Class as PersistenceClass, InsertClass } from '@/core/database/schema/classes.schema';
import { classSchedules } from '@/core/database/schema/class-schedules.schema';
import { classStudents } from '@/core/database/schema/class-students.schema';
import { Class, ClassId } from '@/domain/models';
import { IClassRepository } from '@/domain/repositories/i-class.repository';
import { ClassMapper } from '@/infrastructure/mappers/class.mapper';
import { SoftDeleteRepository } from './base.repository';

export class ClassRepository 
  extends SoftDeleteRepository<typeof classes, PersistenceClass, InsertClass> 
  implements IClassRepository
{
  constructor(db: DbExecutor) {
    super(db, classes);
  }

  async findById(id: ClassId): Promise<Class | null> {
    const raw = await super.executeFindById(id as string);
    if (!raw) return null;
    
    const schedules = await this.db
      .select()
      .from(classSchedules)
      .where(eq(classSchedules.classId, id as string));
      
    const enrollments = await this.db
      .select()
      .from(classStudents)
      .where(eq(classStudents.classId, id as string));

    return ClassMapper.toDomain(raw, schedules, enrollments);
  }

  async findMany(ids: readonly ClassId[]): Promise<readonly Class[]> {
    if (ids.length === 0) return [];
    const raw = await super.executeFindMany(ids as readonly string[]);
    
    const schedules = await this.db.select().from(classSchedules);
    const enrollments = await this.db.select().from(classStudents);
    
    return raw.map(cls => {
      const scheds = schedules.filter(s => s.classId === cls.id);
      const enrs = enrollments.filter(e => e.classId === cls.id);
      return ClassMapper.toDomain(cls, scheds, enrs);
    });
  }

  async findAll(): Promise<readonly Class[]> {
    const raw = await super.executeFindAll();
    const schedules = await this.db.select().from(classSchedules);
    const enrollments = await this.db.select().from(classStudents);
    
    return raw.map(cls => {
      const scheds = schedules.filter(s => s.classId === cls.id);
      const enrs = enrollments.filter(e => e.classId === cls.id);
      return ClassMapper.toDomain(cls, scheds, enrs);
    });
  }

  async findAllActive(): Promise<readonly Class[]> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.isArchived, false));
    
    const schedules = await this.db.select().from(classSchedules);
    const enrollments = await this.db.select().from(classStudents);
    
    return results.map(cls => {
      const scheds = schedules.filter(s => s.classId === cls.id);
      const enrs = enrollments.filter(e => e.classId === cls.id);
      return ClassMapper.toDomain(cls, scheds, enrs);
    });
  }

  async save(classData: Class): Promise<Class> {
    const persistenceModel = ClassMapper.toPersistence(classData);

    return await this.db.transaction(async (tx) => {
      // 1. Save root entity (Class)
      const existing = await tx
        .select()
        .from(this.table)
        .where(eq(this.table.id, classData.id as string))
        .limit(1)
        .then(res => res[0]);

      let result: PersistenceClass;
      if (existing) {
        result = await tx
          .update(this.table)
          .set(persistenceModel)
          .where(eq(this.table.id, classData.id as string))
          .returning()
          .then(res => res[0]);
      } else {
        result = await tx
          .insert(this.table)
          .values(persistenceModel)
          .returning()
          .then(res => res[0]);
      }

      // 2. Save schedules if provided
      if (classData.schedules) {
        const currentSchedIds = classData.schedules.map(s => s.id as string);
        if (currentSchedIds.length > 0) {
          await tx.delete(classSchedules).where(and(eq(classSchedules.classId, classData.id as string), notInArray(classSchedules.id, currentSchedIds)));
        } else {
          await tx.delete(classSchedules).where(eq(classSchedules.classId, classData.id as string));
        }

        for (const schedule of classData.schedules) {
          const schedulePersistence = ClassMapper.toPersistenceSchedule(schedule);
          const existingSchedule = await tx
            .select()
            .from(classSchedules)
            .where(eq(classSchedules.id, schedule.id as string))
            .limit(1)
            .then(res => res[0]);

          if (existingSchedule) {
            await tx
              .update(classSchedules)
              .set(schedulePersistence)
              .where(eq(classSchedules.id, schedule.id as string));
          } else {
            await tx
              .insert(classSchedules)
              .values(schedulePersistence);
          }
        }
      } else {
        await tx.delete(classSchedules).where(eq(classSchedules.classId, classData.id as string));
      }
      
      // 3. Save enrollments if provided
      if (classData.enrollments) {
        const currentEnrIds = classData.enrollments.map(e => e.id as string);
        if (currentEnrIds.length > 0) {
          await tx.delete(classStudents).where(and(eq(classStudents.classId, classData.id as string), notInArray(classStudents.id, currentEnrIds)));
        } else {
          await tx.delete(classStudents).where(eq(classStudents.classId, classData.id as string));
        }

        for (const enrollment of classData.enrollments) {
          const enrollmentPersistence = ClassMapper.toPersistenceEnrollment(enrollment);
          const existingEnrollment = await tx
            .select()
            .from(classStudents)
            .where(eq(classStudents.id, enrollment.id as string))
            .limit(1)
            .then(res => res[0]);

          if (existingEnrollment) {
            await tx
              .update(classStudents)
              .set(enrollmentPersistence)
              .where(eq(classStudents.id, enrollment.id as string));
          } else {
            await tx
              .insert(classStudents)
              .values(enrollmentPersistence);
          }
        }
      } else {
        await tx.delete(classStudents).where(eq(classStudents.classId, classData.id as string));
      }
      
      const savedScheds = await tx.select().from(classSchedules).where(eq(classSchedules.classId, classData.id as string));
      const savedEnrs = await tx.select().from(classStudents).where(eq(classStudents.classId, classData.id as string));
      return ClassMapper.toDomain(result, savedScheds, savedEnrs);
    });
  }

  async archive(id: ClassId): Promise<void> {
    await super.executeSoftDelete(id as string);
  }
}
