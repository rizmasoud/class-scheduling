import { Teacher, TeacherId } from '@/domain/models';

export interface ITeacherRepository {
  findById(id: TeacherId): Promise<Teacher | null>;
  findAll(): Promise<readonly Teacher[]>;
  findAllActive(): Promise<readonly Teacher[]>;
  findMany(ids: readonly TeacherId[]): Promise<readonly Teacher[]>;
  save(teacher: Teacher): Promise<Teacher>;
  archive(id: TeacherId): Promise<void>;
}
