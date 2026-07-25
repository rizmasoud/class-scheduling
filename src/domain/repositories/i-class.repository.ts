import { Class, ClassId } from '@/domain/models';

export interface IClassRepository {
  findById(id: ClassId): Promise<Class | null>;
  findAll(): Promise<readonly Class[]>;
  findAllActive(): Promise<readonly Class[]>;
  findMany(ids: readonly ClassId[]): Promise<readonly Class[]>;
  save(classData: Class): Promise<Class>;
  saveMany(classes: readonly Class[]): Promise<readonly Class[]>;
  archive(id: ClassId): Promise<void>;
}
